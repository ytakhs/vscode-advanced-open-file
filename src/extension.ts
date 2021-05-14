"use strict";

import { commands, ExtensionContext } from "vscode";

import { advancedOpenFile, advancedOpenWorkspaceFile } from "./advancedOpenFile";

export function activate(context: ExtensionContext) {
  context.subscriptions.push(commands.registerCommand("extension.advancedOpenFile", advancedOpenFile));
  context.subscriptions.push(commands.registerCommand("extension.advancedOpenWorkspaceFile", advancedOpenWorkspaceFile));
}

export function deactivate() {}
