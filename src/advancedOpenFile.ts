"use strict"
import {
  window,
  FileType,
  QuickPickItem,
} from "vscode"

import { sync as globSync } from "glob"
import * as fs from "fs"

const detectFileType = (stat: fs.Stats): FileType => {
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

interface FilePickItem extends QuickPickItem {
    filetype: FileType
}

const createFilePicker = () => {
  // const root = workspace.workspaceFolders[0]
  const pickFileItems = globSync("**", { ignore: "**/node_modules/**" }).map(f => {
      const filetype = detectFileType(fs.statSync(f))
      // const filepath = path.join(root.uri.toString(), f)

      return {
          label: f,
          filetype: filetype,
      } as FilePickItem
  })

  const quickpick = window.createQuickPick()
  quickpick.items = pickFileItems
  quickpick.placeholder = "select file"

  return quickpick
}

export const advancedOpenFile = async () => {
  // The code you place here will be executed every time your command is executed
  const quickpick = createFilePicker()

  quickpick.show()

  const picked = await new Promise<QuickPickItem | undefined>((resolve) => {
      quickpick.onDidAccept(() => resolve(quickpick.activeItems[0]))
  })
  quickpick.hide()

  if (!picked) {
      throw "failed"
  }

  const filePickItem = picked as FilePickItem
  console.log(filePickItem.filetype)

  window.showInformationMessage(picked.label)
}
