'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {
  commands,
  window,
  workspace,
  ExtensionContext,
} from "vscode";

import { sync as globSync } from "glob"

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
        let files = await workspace.findFiles("**", "**/node_modules/**", 10)
        // let folders = [...workspace.workspaceFolders].map(f => { return f.name })
        // let filenames: string[] = [...files].map(file => { return file.toString() })
        let fs = globSync("**", { ignore: "**/node_modules/**" }).map(path => {
            return path
        })
        // const quickPick = window.createQuickPick()
        // quickPick.items = filenames
        // const items = [...folders, ...filenames]
        const picked = await window.showQuickPick(fs)
        window.showInformationMessage(picked)
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
