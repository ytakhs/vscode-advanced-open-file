import { window, type Disposable, type Uri } from "vscode";
import type { FileItem } from "../fileItem";
import { initActions, type Actions } from "./actions";
import { initState } from "./state";
import { initOptions } from "./options";
import { initOnDidAccept, initOnDidChangeValue } from "./handlers";

export type App = {
  disposables: Array<Disposable>;
  actions: Actions;
};

export const initApp = ({ currentUri }: { currentUri: Uri }): App => {
  const disposables: Disposable[] = [];
  const picker = window.createQuickPick<FileItem>();
  const state = initState({ currentUri });
  const options = initOptions();
  const actions = initActions(state, options);

  const app: App = {
    disposables,
    actions,
  };

  disposables.push(picker);
  disposables.push(picker.onDidChangeValue(initOnDidChangeValue(app)));
  disposables.push(picker.onDidAccept(initOnDidAccept(app)));

  return app;
};

export const deinitApp = (app: App) => {
  for (const d of app.disposables) {
    d.dispose();
  }
};
