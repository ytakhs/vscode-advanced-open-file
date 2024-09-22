import { window, type Disposable } from "vscode";
import { initActions, type Actions } from "./actions";
import { initState } from "./state";
import { initOptions } from "./options";
import {
  initOnDidAcceptHandler,
  initOnDidChangeValueHandler,
  initOnHideHandler,
} from "./handlers";

export type App = {
  disposables: Array<Disposable>;
  actions: Actions;
};

export const initApp = (): App => {
  const disposables: Disposable[] = [];
  const state = initState();
  const picker = state.picker;
  const options = initOptions();
  const actions = initActions(state, options);

  const app: App = {
    disposables,
    actions,
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
