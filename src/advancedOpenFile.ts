"use strict"
import {
  window,
  FileType,
  QuickPick,
  QuickPickItem,
  workspace,
  WorkspaceFolder,
  Disposable,
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
        this.filetype = filetype
        if (filetype == FileType.Directory) {
            this.description = "Directory"
        }
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

function createFilePicker(value: string, items: ReadonlyArray<QuickPickItem>): QuickPick<QuickPickItem> {
  const quickpick = window.createQuickPick()
  quickpick.value = value
  quickpick.items = items
  quickpick.placeholder = "select file"

  return quickpick
}

async function pickFile(value: string, rootpath: string, items: ReadonlyArray<QuickPickItem>): Promise<QuickPickItem | string | undefined> {
    const quickpick = createFilePicker(value, items)

    quickpick.show()

    const disposables: Disposable[] = []
    const pickedItem = await new Promise<QuickPickItem | string | undefined>((resolve) => {
        disposables.push(quickpick.onDidChangeValue((value) => {
            createFilePickItems(rootpath, value).then((items) => {
                quickpick.items = items
            })
        }))

        disposables.push(quickpick.onDidAccept(() => {
            if (quickpick.selectedItems[0]) {
                resolve(quickpick.selectedItems[0])
            } else {
                resolve(quickpick.value)
            }
        }))
    })

    quickpick.hide()

    quickpick.dispose()
    disposables.forEach(d => d.dispose())

    if (typeof pickedItem === "string") {
        return pickedItem
    } else if (pickedItem instanceof FilePickItem) {
        if (pickedItem.filetype === FileType.Directory) {
            const items = await createFilePickItems(rootpath, pickedItem.relativePath)
            return pickFile(pickedItem.label, rootpath, items)
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
    const pickedItem = await pickFile("", rootpath, filePickItems)

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
