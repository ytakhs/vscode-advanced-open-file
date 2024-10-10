import { window, type Disposable } from "vscode";
import { initActions, type Actions } from "./actions";
import { initState } from "./state";
import { initOptions, type Options } from "./options";
import {
  initOnDidAcceptHandler,
  initOnDidChangeValueHandler,
  initOnHideHandler,
} from "./handlers";

export const INITIAL_VALUE = "" as const;

export type App = {
  disposables: Array<Disposable>;
  actions: Actions;
  options: Options;
};

export const initApp = (): App => {
  const disposables: Disposable[] = [];
  const state = initState();
  const picker = state.picker;
  const options = initOptions();
  const actions = initActions(state);

  const app: App = {
    disposables,
    actions,
    options,
  };

  disposables.push(picker);
  disposables.push(picker.onDidChangeValue(initOnDidChangeValueHandler(app)));
  disposables.push(picker.onDidAccept(initOnDidAcceptHandler(app)));
  disposables.push(picker.onDidHide(initOnHideHandler(app)));

  return app;
};

export const ensureApp = (app: App | undefined): App | never => {
  if (app === undefined) {
    window.showErrorMessage("App is not initialized.");

    throw new Error("App is not initialized.");
  }

  return app;
};

export const deinitApp = (app: App) => {
  for (const d of app.disposables) {
    d.dispose();
  }
};
