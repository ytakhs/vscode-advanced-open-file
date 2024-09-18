import { FileSystemError, window, workspace, type Uri } from "vscode";

export const isUriExists = async (uri: Uri): Promise<boolean> => {
  try {
    await workspace.fs.stat(uri);

    return true;
  } catch (err) {
    if (!(err instanceof FileSystemError)) {
      window.showErrorMessage(
        "An error occurred while checking the file existence.",
      );

      return false;
    }

    console.debug(err.message, err.code);

    return false;
  }
};
