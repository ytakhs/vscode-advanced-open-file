"use strict"

import { commands, ExtensionContext } from "vscode"

import { advancedOpenFile } from "./advancedOpenFile"

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand("extension.advancedOpenFile", advancedOpenFile)
  )
}

export function deactivate() {}
