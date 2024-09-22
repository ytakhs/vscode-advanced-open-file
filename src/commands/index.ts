import { dirname } from "node:path";
import { Uri, window } from "vscode";
import { appendSepToUri, isFileScheme } from "../fsUtils";
import type { App } from "../app";

export const initPickFromActiveDir = (app: App) => {
  return async () => {
    const currentDir = getCurrentDir();
    if (currentDir === undefined) {
      window.showErrorMessage("No workspace is opened.");
      return;
    }

    const { pick } = app.actions;

    pick(appendSepToUri(currentDir));
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
