import { dirname, sep as pathSep } from "node:path";
import { window, workspace } from "vscode";
import {
  commands,
  type ExtensionContext,
  type WorkspaceFolder,
  Uri,
} from "vscode";
import { AdvancedOpenFile } from "./advancedOpenFile";
import { isFileScheme } from "./fsUtils";
import { initPickCommand } from "./commands";
import { type App, deinitApp, ensureApp, initApp } from "./app";

async function pickWorkspace(): Promise<string> {
  const targetWorkspaceFolder: WorkspaceFolder | undefined =
    await window.showWorkspaceFolderPick();
  if (targetWorkspaceFolder === undefined) {
    throw new Error("No workspace is opened.");
  }

  return targetWorkspaceFolder.uri.path;
}

async function pathToCurrentDirectory(): Promise<string> {
  const currentEditor = window.activeTextEditor;
  if (currentEditor) {
    if (isFileScheme(currentEditor.document.uri)) {
      return dirname(currentEditor.document.uri.path);
    }
  }

  return pickWorkspace();
}

async function pathToCurrentWorkspace(): Promise<string> {
  const currentEditor = window.activeTextEditor;
  if (currentEditor) {
    const folder = workspace.getWorkspaceFolder(currentEditor.document.uri);
    if (folder === undefined) {
      throw new Error("No workspace exists");
    }

    return folder.uri.path;
  }

  return pickWorkspace();
}

async function advancedOpenFile(): Promise<void> {
  let defaultDir = await pathToCurrentDirectory();
  defaultDir += pathSep;

  const f = new AdvancedOpenFile(Uri.file(defaultDir));
  f.pick();
}

async function advancedOpenWorkspaceFile(): Promise<void> {
  let defaultDir = await pathToCurrentWorkspace();
  defaultDir += pathSep;

  const f = new AdvancedOpenFile(Uri.file(defaultDir));
  f.pick();
}

let app: App | undefined = undefined;

export function activate(context: ExtensionContext) {
  app = initApp();
  app = ensureApp(app);

  context.subscriptions.push(
    commands.registerCommand("extension.advancedOpenFile", advancedOpenFile),
  );
  context.subscriptions.push(
    commands.registerCommand(
      "extension.advancedOpenWorkspaceFile",
      advancedOpenWorkspaceFile,
    ),
  );
  context.subscriptions.push(
    commands.registerCommand(
      "vscode-advanced-open-file.pickFromActiveDirectory",
      initPickCommand(app, false),
    ),
  );
  context.subscriptions.push(
    commands.registerCommand(
      "vscode-advanced-open-file.pickFromWorkspaceRoot",
      initPickCommand(app, true),
    ),
  );
}

export function deactivate() {
  if (app !== undefined) {
    deinitApp(app);
    app = undefined;
  }
}
