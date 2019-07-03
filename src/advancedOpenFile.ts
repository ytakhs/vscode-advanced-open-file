"use strict"
import { window, FileType, QuickPick, QuickPickItem, workspace, WorkspaceFolder, Disposable } from "vscode"

import * as path from "path"
import * as fs from "fs"
import * as mkdirp from "mkdirp"
import * as os from "os"

const pathSeparator = path.sep
const fsRoot = os.platform() === "win32" ? process.cwd().split(path.sep)[0] : "/"
const icons = {
  [FileType.File]: "$(file)",
  [FileType.Directory]: "$(file-directory)",
  [FileType.SymbolicLink]: "$(file-symlink-file)",
  [FileType.Unknown]: "$(file)",
}

class FilePickItem implements QuickPickItem {
  absolutePath: string
  alwaysShow: boolean
  label: string
  detail: string
  description: string
  filetype: FileType

  constructor(absolutePath: string, filetype: FileType, label?: string) {
    this.absolutePath = absolutePath
    this.label = `${icons[filetype]} ${label || path.basename(absolutePath)}`
    this.alwaysShow = true
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

function createFilePickItems(value: string): Promise<ReadonlyArray<QuickPickItem>> {
  return new Promise(resolve => {
    let directory = value
    let fragment = ""
    if (!value.endsWith(pathSeparator)) {
      directory = path.dirname(value)
      fragment = path.basename(value)
    }

    fs.readdir(directory, { encoding: "utf-8" }, (err, files) => {
      let matchedFiles = files.filter(f => {
        if (fragment.toLowerCase() === fragment) {
          return f.toLowerCase().startsWith(fragment)
        }

        return f.startsWith(fragment)
      })

      const filePickItems = matchedFiles.map(f => {
        const absolutePath = path.join(directory, f)
        const filetype = detectFileType(fs.statSync(absolutePath))

        return new FilePickItem(absolutePath, filetype)
      })

      if (!fragment && directory !== fsRoot) {
        const parent = path.dirname(directory)
        filePickItems.unshift(new FilePickItem(parent, FileType.Directory, ".."))
      }
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

async function pickFile(value: string, items: ReadonlyArray<QuickPickItem>): Promise<QuickPickItem | string> {
  const quickpick = createFilePicker(value, items)
  const disposables: Disposable[] = []

  try {
    quickpick.show()

    const pickedItem = await new Promise<QuickPickItem | string>(resolve => {
      disposables.push(
        quickpick.onDidChangeValue(value => {
          createFilePickItems(value).then(items => {
            quickpick.items = items
          })
        })
      )

      disposables.push(
        quickpick.onDidAccept(() => {
          if (quickpick.selectedItems[0]) {
            resolve(quickpick.selectedItems[0])
          } else {
            resolve(quickpick.value)
          }
        })
      )
    })

    quickpick.hide()

    if (typeof pickedItem === "string") {
      return pickedItem
    } else if (pickedItem instanceof FilePickItem) {
      if (pickedItem.filetype === FileType.Directory) {
        const directory = pickedItem.absolutePath + (pickedItem.absolutePath === fsRoot ? "" : pathSeparator)
        const items = await createFilePickItems(directory)
        return pickFile(directory, items)
      } else {
        return pickedItem
      }
    }
  } finally {
    quickpick.dispose()
    disposables.forEach(d => d.dispose())
  }
}

function createFile(path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.appendFile(path, "", err => {
      if (err) {
        reject(err)
      }
    })

    resolve()
  })
}

function createDir(dir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(dir)) {
      mkdirp(dir, (err, made) => {
        if (err) {
          reject(err)
        }

        resolve()
      })
    } else {
      resolve()
    }
  })
}

async function openFile(path: string): Promise<void> {
  const document = await workspace.openTextDocument(path)
  if (!document) {
    throw new Error("no such file exists")
  }

  const editor = await window.showTextDocument(document)
  if (!editor) {
    throw new Error("showing document failed.")
  }
}

export async function advancedOpenFile() {
  const currentEditor = window.activeTextEditor
  let targetWorkspaceFolder: WorkspaceFolder
  let defaultDir: string

  if (!currentEditor) {
    targetWorkspaceFolder = await window.showWorkspaceFolderPick()
    defaultDir = targetWorkspaceFolder.uri.path
  } else {
    defaultDir = path.dirname(currentEditor.document.uri.path)
  }
  defaultDir += pathSeparator

  const filePickItems = await createFilePickItems(defaultDir)
  const pickedItem = await pickFile(defaultDir, filePickItems)

  if (!pickedItem) {
    throw new Error("failed")
  }

  if (typeof pickedItem === "string") {
    const newFilePath = pickedItem
    try {
      const parts = newFilePath.split(pathSeparator)
      const fragment = parts[parts.length - 1]
      const direcotry = newFilePath.substring(0, newFilePath.length - fragment.length)

      await createDir(direcotry)
      await createFile(newFilePath)
    } catch (err) {
      window.showWarningMessage(`${err}: ${newFilePath} already exists.`)
    }

    try {
      await openFile(newFilePath)
    } catch (err) {
      window.showWarningMessage(err)
    }
  } else if (pickedItem instanceof FilePickItem) {
    try {
      await openFile(pickedItem.absolutePath)
    } catch (err) {
      window.showWarningMessage(err)
    }
  }
}
