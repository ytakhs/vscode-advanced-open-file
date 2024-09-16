import * as fs from "fs";
import * as Path from "path";
import * as vscode from "vscode";
import { commands, ExtensionContext, WorkspaceFolder, Uri } from "vscode";
import { AdvancedOpenFile } from "./advancedOpenFile";

async function pickWorkspace(): Promise<string> {
  const targetWorkspaceFolder: WorkspaceFolder | undefined =
    await vscode.window.showWorkspaceFolderPick();
  if (targetWorkspaceFolder === undefined) {
    throw new Error("No workspace is opened.");
  }

  return targetWorkspaceFolder.uri.path;
}

async function pathToCurrentDirectory(): Promise<string> {
  const currentEditor = vscode.window.activeTextEditor;
  if (currentEditor) {
    try {
      // If the uri does not exist, it raises an exception.
      await vscode.workspace.fs.stat(currentEditor.document.uri);
      return Path.dirname(currentEditor.document.uri.path);
    } catch {
      // Ignore the error from fs.stat and return pickWorkspace();
    }
  }
  return pickWorkspace();
}

async function pathToCurrentWorkspace(): Promise<string> {
  const currentEditor = vscode.window.activeTextEditor;
  if (currentEditor) {
    const folder = vscode.workspace.getWorkspaceFolder(
      currentEditor.document.uri
    );
    if (folder === undefined) {
      throw new Error("No workspace exists");
    }

    return folder.uri.path;
  }

  return pickWorkspace();
}

async function advancedOpenFile(): Promise<void> {
  let defaultDir = await pathToCurrentDirectory();
  defaultDir += Path.sep;

  const f = new AdvancedOpenFile(Uri.file(defaultDir));
  f.pick();
}

async function advancedOpenWorkspaceFile(): Promise<void> {
  let defaultDir = await pathToCurrentWorkspace();
  defaultDir += Path.sep;

  const f = new AdvancedOpenFile(Uri.file(defaultDir));
  f.pick();
}

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand("extension.advancedOpenFile", advancedOpenFile)
  );
  context.subscriptions.push(
    commands.registerCommand(
      "extension.advancedOpenWorkspaceFile",
      advancedOpenWorkspaceFile
    )
  );
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() {}
