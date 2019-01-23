"use strict"
import {
  window,
  FileType,
  QuickPick,
  QuickPickItem,
  Uri,
  workspace,
  WorkspaceFolder,
} from "vscode"

import * as glob from "glob"
import * as fs from "fs"

class FilePickItem implements QuickPickItem {
    label: string
    filetype: FileType

    constructor(path: string, filetype: FileType) {
        this.label = path;
        this.filetype = filetype
    }
}

function detectFileType(stat: fs.Stats): FileType {
  if (stat.isFile()) {
      return FileType.File
  } else if (stat.isDirectory()) {
      return FileType.Directory
  } else if (stat.isSymbolicLink()) {
      return FileType.SymbolicLink
  } else {
      return FileType.Unknown
  }
}

function filesToExclude(projectRootPath: string): ReadonlyArray<string> {
    const excludesFromConfiguration = Object.assign(
        workspace.getConfiguration("files", Uri.file(projectRootPath)).get("exclude"),
        workspace.getConfiguration("advancedOpenFile").get("excludeFiles")
    )

    return Object.keys(excludesFromConfiguration)
}

function createFilePickItems(root: Uri, ignoreFiles: ReadonlyArray<string>): Promise<ReadonlyArray<QuickPickItem>> {
    return new Promise((resolve) => {
        console.log(ignoreFiles)
        glob(`${root.path}/**`, { ignore: ignoreFiles }, (err, matches) => {
            if (err) {
                throw err
            }

            const files = matches.map(f => {
                const filetype = detectFileType(fs.statSync(f))

                return new FilePickItem(f, filetype)
            })

            resolve(files)
        })
    })
}

function createFilePicker(initialValue: string, items: ReadonlyArray<QuickPickItem>) {
  const quickpick = window.createQuickPick()
  quickpick.value = initialValue
  quickpick.items = items
  quickpick.placeholder = "select file"

  return quickpick
}

async function pickFile(qp: QuickPick<QuickPickItem>): Promise<QuickPickItem | string | undefined> {
    let quickpick: QuickPick<QuickPickItem>

    quickpick = qp

    quickpick.show()

    const pickedItem = await new Promise<QuickPickItem | string | undefined>((resolve) => {
        quickpick.onDidAccept(() => {
            if (quickpick.selectedItems[0]) {
                resolve(quickpick.selectedItems[0])
            } else {
                resolve(quickpick.value)
            }
        })
    })

    quickpick.hide()

    if (typeof pickedItem === "string") {
        return pickedItem
    } else if (pickedItem instanceof FilePickItem) {
        if (pickedItem.filetype === FileType.Directory) {
            const initialValue = pickedItem.label
            const items = quickpick.items
            quickpick.dispose()

            quickpick = createFilePicker(initialValue, items)
            quickpick.value = initialValue
            return pickFile(quickpick)
        } else {
            return pickedItem
        }
    }

}

function createFile(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.appendFile(path, "", (err) => {
            if (err) { reject(err) }
        })

        resolve()
    })
}

async function openFile(path: string): Promise<void> {
    const document = await workspace.openTextDocument(path)
    if (!document) {
        throw "no such file exists"
    }

    const editor = await window.showTextDocument(document)
    if (!editor) {
        throw "showing document failed."
    }
}

export async function advancedOpenFile() {
    const currentEditor = window.activeTextEditor
    let targetWorkspaceFolder: WorkspaceFolder

    if (!currentEditor) {
        targetWorkspaceFolder = await window.showWorkspaceFolderPick()
    } else {
        targetWorkspaceFolder = workspace.getWorkspaceFolder(currentEditor.document.uri)
    }

    const ignoreFiles = filesToExclude(targetWorkspaceFolder.uri.path)
    const filePickItems = await createFilePickItems(targetWorkspaceFolder.uri, ignoreFiles)
    const quickpick = createFilePicker(targetWorkspaceFolder.uri.path, filePickItems)

    const pickedItem = await pickFile(quickpick)

    if (!pickedItem) {
        throw "failed"
    }

    if (typeof pickedItem === "string") {
        const newFilePath = pickedItem
        try {
            await createFile(newFilePath)
        } catch(err) {
            window.showWarningMessage(`${err}: ${newFilePath} already exists.`)
        }

        try {
            await openFile(newFilePath)
        } catch(err) {
            window.showWarningMessage(err)
        }


    } else if (pickedItem instanceof FilePickItem) {
        try {
            await openFile(pickedItem.label)
        } catch(err) {
            window.showWarningMessage(err)
        }
    }
}
