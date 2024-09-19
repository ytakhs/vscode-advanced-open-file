import { dirname, sep as pathSep } from "node:path";
import { window, workspace } from "vscode";
import {
  commands,
  type ExtensionContext,
  type WorkspaceFolder,
  Uri,
} from "vscode";
import { AdvancedOpenFile } from "./advancedOpenFile";
import { isFileScheme, isUriExists } from "./fsUtils";

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

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand("extension.advancedOpenFile", advancedOpenFile),
  );
  context.subscriptions.push(
    commands.registerCommand(
      "extension.advancedOpenWorkspaceFile",
      advancedOpenWorkspaceFile,
    ),
  );
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() {}
