import { window } from "vscode";

export class OpenUriError extends Error {}

export const handleError = (err: unknown): void => {
  if (err instanceof Error) {
    window.showErrorMessage(`${err.name}: ${err.message}`);

    return;
  }

  window.showErrorMessage("Unknown error occurred");
};
