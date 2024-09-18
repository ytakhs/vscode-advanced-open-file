import { FileSystemError, window, workspace, type Uri } from "vscode";

export const isFileExists = async (uri: Uri): Promise<boolean> => {
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

    if (err.code === "FileNotFound") {
      console.debug(err.message);

      return false;
    }

    window.showErrorMessage(err.message);

    return false;
  }
};
