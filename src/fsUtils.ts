import { dirname, sep } from "node:path";
import { platform } from "node:process";
import {
  FileSystemError,
  type TextDocument,
  Uri,
  window,
  workspace,
} from "vscode";
import { OpenUriError } from "./app/error";

export const isFileScheme = (uri: Uri): boolean => {
  return uri.scheme === "file";
};

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

    if (err.code === "FileNotFound") {
      return false;
    }

    window.showErrorMessage(
      `An error occurred while checking the file existence: ${err.message}`,
    );

    return false;
  }
};

export const createFileWithDir = async (
  uri: Uri,
  content: Uint8Array,
): Promise<void> => {
  const directory = Uri.file(dirname(uri.fsPath));

  await workspace.fs.createDirectory(directory);

  await workspace.fs.writeFile(uri, content);
};

export const openFile = async (uri: Uri): Promise<void> => {
  let doc: TextDocument;

  try {
    doc = await workspace.openTextDocument(uri);
  } catch (e) {
    const newErr = new OpenUriError(`Failed to open the file: ${uri.path}`);
    newErr.name = "OpenUriError";

    throw newErr;
  }

  await window.showTextDocument(doc);
};

export const appendSepToUri = (uri: Uri): Uri => {
  return uri.with({ path: `${uri.path}${sep}` });
};

export const getFsRoot = (): string => {
  return platform === "win32" ? process.cwd().split(sep)[0] : "/";
};
