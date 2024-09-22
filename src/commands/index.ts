import { dirname } from "node:path";
import { Uri, window, workspace } from "vscode";
import { appendSepToUri, isFileScheme } from "../fsUtils";
import type { App } from "../app";

export const initPickCommand = (app: App, fromRoot: boolean) => {
  return async () => {
    let targetDir = getCurrentDir() || (await pickWorkspaceRootDir());
    if (targetDir === undefined) {
      window.showErrorMessage("No workspace is selected.");
      return;
    }

    if (fromRoot) {
      targetDir = workspace.getWorkspaceFolder(targetDir)?.uri;
      if (targetDir === undefined) {
        window.showErrorMessage("No workspace is selected.");
        return;
      }
    }

    const { showPicker } = app.actions;

    showPicker(appendSepToUri(targetDir));
  };
};

export const initPickCommandWithDeprecation = (
  app: App,
  fromRoot: boolean,
  alternative: string,
) => {
  return async () => {
    window.showWarningMessage(
      `This command is deprecated. Please use the ${alternative} instead.`,
    );

    await initPickCommand(app, fromRoot)();
  };
};

const getCurrentDir = (): Uri | undefined => {
  const currentEditor = window.activeTextEditor;
  if (currentEditor === undefined) {
    return undefined;
  }

  if (!isFileScheme(currentEditor.document.uri)) {
    return undefined;
  }

  const dir = dirname(currentEditor.document.uri.fsPath);

  return Uri.file(dir);
};

const pickWorkspaceRootDir = async (): Promise<Uri | undefined> => {
  const targetWorkspaceFolder = await window.showWorkspaceFolderPick();
  if (targetWorkspaceFolder === undefined) {
    return undefined;
  }

  return targetWorkspaceFolder.uri;
};
