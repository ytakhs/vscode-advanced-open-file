import { sep } from "node:path";
import { FileType, Uri } from "vscode";
import type { App } from ".";
import { createFileItems } from "../fileItem";
import { createFileWithDir, openFile } from "../fsUtils";
import { platform } from "node:os";

export const initOnDidChangeValue = (app: App) => {
  return (value: string) => {
    createFileItems(value).then(app.actions.setItems);
  };
};

export const initOnDidAccept = (app: App) => {
  return () => {
    const { getValue, getSelectedItem, setValue, pick } = app.actions;
    const selectedItem = getSelectedItem();

    // no existing file or directory, so create a new file.
    if (selectedItem === undefined) {
      const newUri = getValue();

      createFileWithDir(newUri, new Uint8Array(0))
        .then(() => setValue(newUri))
        .then(() => openFile(newUri));

      return;
    }

    // open if it's a file
    if ((selectedItem.filetype & FileType.File) > 0) {
      const uri = Uri.file(selectedItem.absolutePath);
      openFile(uri).then(() => setValue(uri));

      return;
    }

    // continue picking if it's a directory
    const fsRoot = platform() === "win32" ? process.cwd().split(sep)[0] : "/";
    const newFsPath =
      selectedItem.absolutePath +
      (selectedItem.absolutePath === fsRoot ? "" : sep);

    const uri = Uri.file(newFsPath);
    setValue(uri);
    pick(uri);
  };
};
