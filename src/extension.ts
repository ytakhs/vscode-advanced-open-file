import { commands, type ExtensionContext } from "vscode";
import { initPickCommand, initPickCommandWithDeprecation } from "./commands";
import { type App, deinitApp, ensureApp, initApp } from "./app";

let app: App | undefined = undefined;

export function activate(context: ExtensionContext) {
  app = initApp();
  app = ensureApp(app);

  context.subscriptions.push(
    commands.registerCommand(
      "extension.advancedOpenFile",
      initPickCommandWithDeprecation(
        app,
        false,
        "vscode-advanced-open-file.pickFromActiveDirectory",
      ),
    ),
  );
  context.subscriptions.push(
    commands.registerCommand(
      "extension.advancedOpenWorkspaceFile",
      initPickCommandWithDeprecation(
        app,
        true,
        "vscode-advanced-open-file.pickFromWorkspaceRoot",
      ),
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
