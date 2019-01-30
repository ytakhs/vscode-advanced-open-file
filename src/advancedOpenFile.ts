"use strict"
import { window, FileType, QuickPick, QuickPickItem, workspace, WorkspaceFolder, Disposable } from "vscode"

import * as path from "path"
import * as fs from "fs"
import * as mkdirp from "mkdirp"

const pathSeparator = path.sep

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
    if (filetype === FileType.Directory) {
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

function createFilePickItems(rootPath: string, dir: string): Promise<ReadonlyArray<QuickPickItem>> {
  return new Promise(resolve => {
    const currentpath = path.join(rootPath, dir)
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

async function pickFile(
  value: string,
  rootPath: string,
  items: ReadonlyArray<QuickPickItem>
): Promise<QuickPickItem | string> {
  const quickpick = createFilePicker(value, items)
  const disposables: Disposable[] = []

  try {
    let previousReadDir: string | undefined = undefined

    quickpick.show()

    const pickedItem = await new Promise<QuickPickItem | string>(resolve => {
      disposables.push(
        quickpick.onDidChangeValue(value => {
          const currentDir = detectCurrentDir(rootPath, path.join(rootPath, value))
          if (previousReadDir && previousReadDir === currentDir) {
            return
          }

          createFilePickItems(rootPath, currentDir).then(items => {
            quickpick.items = items
            previousReadDir = currentDir
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
        const items = await createFilePickItems(rootPath, pickedItem.relativePath)
        return pickFile(pickedItem.label + pathSeparator, rootPath, items)
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

function createDir(dir: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(dir)) {
      mkdirp(dir, (err, made) => {
        if (err) {
          reject(err)
        }

        resolve(made)
      })
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

function detectCurrentDir(rootPath: string, currentPath: string): string {
  const rootParts = rootPath.split(pathSeparator)
  const currentParts = currentPath.split(pathSeparator)
  if (rootParts.length === currentParts.length) {
    return ""
  }

  const fragment = currentParts[currentParts.length - 1]
  const directoryPath = currentPath.substring(0, currentPath.length - fragment.length)

  return directoryPath.substring(rootPath.length + 1, directoryPath.length)
}

export async function advancedOpenFile() {
  const currentEditor = window.activeTextEditor
  let targetWorkspaceFolder: WorkspaceFolder
  let rootPath: string
  let defaultDir: string

  if (!currentEditor) {
    targetWorkspaceFolder = await window.showWorkspaceFolderPick()
    rootPath = targetWorkspaceFolder.uri.path
    defaultDir = ""
  } else {
    targetWorkspaceFolder = workspace.getWorkspaceFolder(currentEditor.document.uri)
    rootPath = targetWorkspaceFolder.uri.path
    defaultDir = detectCurrentDir(rootPath, currentEditor.document.uri.path)
  }

  const filePickItems = await createFilePickItems(rootPath, defaultDir)
  const pickedItem = await pickFile(defaultDir, rootPath, filePickItems)

  if (!pickedItem) {
    throw new Error("failed")
  }

  if (typeof pickedItem === "string") {
    const newFilePath = path.join(rootPath, pickedItem)
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
