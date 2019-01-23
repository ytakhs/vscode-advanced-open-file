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

async function createFilePickItems(root: Uri): Promise<ReadonlyArray<QuickPickItem>> {
    return new Promise((resolve) => {
        glob(`${root.path}/**`, {}, (err, matches) => {
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

function createFilePicker(items: ReadonlyArray<QuickPickItem>) {
  const quickpick = window.createQuickPick()
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

            quickpick = createFilePicker(items)
            quickpick.value = initialValue
            return pickFile(quickpick)
        } else {
            return pickedItem
        }
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

    const filePickItems = await createFilePickItems(targetWorkspaceFolder.uri)
    const quickpick = createFilePicker(filePickItems)

    const pickedItem = await pickFile(quickpick)

    if (!pickedItem) {
        throw "failed"
    }

    const root = workspace.workspaceFolders[0]

    if (typeof pickedItem === "string") {
        const fileUri = path.join(root.uri.toString(), pickedItem)
        console.log(fileUri)
        fs.appendFile(fileUri, "", (err) => { throw err } )

        const document = await workspace.openTextDocument(fileUri)
        if (!document) {
            throw "invalid"
        }

        const editor = await window.showTextDocument(document)
        if (!editor) {
            throw "invalid"
        }
    } else if (pickedItem instanceof FilePickItem) {
        console.log(pickedItem)
    }

    window.showInformationMessage("done")
}
