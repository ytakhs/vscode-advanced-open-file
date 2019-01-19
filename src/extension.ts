'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {
  commands,
  window,
  workspace,
  ExtensionContext,
  FileType,
  QuickPickItem,
  QuickPick,
} from "vscode";

import { sync as globSync } from "glob"
import * as path from "path"
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

const createFilePicker = () => {
    const root = workspace.workspaceFolders[0]
    const pickFileItems = globSync("**", { ignore: "**/node_modules/**" }).map(f => {
        const filetype = detectFileType(fs.statSync(f))
        const filepath = path.join(root.uri.toString(), f)

        return {
            label: filepath,
            filetype: filetype,
        }
    })

    const quickpick = window.createQuickPick()
    quickpick.items = pickFileItems
    quickpick.placeholder = "select file"

    return quickpick
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vscode-advanced-open-file" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = commands.registerCommand('extension.advancedOpenFile', async () => {
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

        window.showInformationMessage(picked.label)
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
