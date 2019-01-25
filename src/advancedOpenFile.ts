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

import * as path from "path"
import * as fs from "fs"

class FilePickItem implements QuickPickItem {
    relativePath: string
    absolutePath: string
    label: string
    detail: string
    description: string
    filetype: FileType

    constructor(relativePath: string, absolutePath: string, filetype: FileType) {
        this.relativePath = relativePath
        this.absolutePath = absolutePath
        this.label = this.relativePath
        this.description = this.relativePath
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
        workspace.getConfiguration("advancedOpenFile").get("excludeFiles"),
        workspace.getConfiguration("files", Uri.file(projectRootPath)).get("exclude")
    )

    return Object.keys(excludesFromConfiguration)
}

function createFilePickItems(rootpath: string, dir: string): Promise<ReadonlyArray<QuickPickItem>> {
    return new Promise((resolve) => {
        const currentpath = path.join(rootpath, dir)
        fs.readdir(currentpath, { encoding: "utf-8" }, (err, files) => {
            const filePickItems = files.map(f => {
                const absolutePath = path.join(currentpath, f)
                const filetype = detectFileType(fs.statSync(absolutePath))

                return new FilePickItem(path.join(dir, f), absolutePath, filetype)
            })

            resolve(filePickItems)
        })
    })
}

function createFilePicker(rootpath: string, initialValue: string, items: ReadonlyArray<QuickPickItem>) {
  const quickpick = window.createQuickPick()
  quickpick.value = initialValue
  quickpick.items = items
  quickpick.placeholder = "select file"

  return quickpick
}

async function pickFile(rootpath: string, qp: QuickPick<QuickPickItem>): Promise<QuickPickItem | string | undefined> {
    let quickpick: QuickPick<QuickPickItem>

    quickpick = qp

    quickpick.show()

    const pickedItem = await new Promise<QuickPickItem | string | undefined>((resolve) => {
        quickpick.onDidChangeValue((value) => {
            createFilePickItems(rootpath, value).then((items) => {
                quickpick.items = items
            })
        })

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
            const items = await createFilePickItems(rootpath, pickedItem.relativePath)
            quickpick.dispose()

            quickpick = createFilePicker(rootpath, pickedItem.label, items)
            return pickFile(rootpath, quickpick)
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

    const rootpath = targetWorkspaceFolder.uri.path
    const filePickItems = await createFilePickItems(rootpath, "")
    const quickpick = createFilePicker(rootpath, "", filePickItems)

    const pickedItem = await pickFile(rootpath, quickpick)

    if (!pickedItem) {
        throw "failed"
    }

    if (typeof pickedItem === "string") {
        const newFilePath = path.join(rootpath, pickedItem)
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
            await openFile(pickedItem.absolutePath)
        } catch(err) {
            window.showWarningMessage(err)
        }
    }
}
