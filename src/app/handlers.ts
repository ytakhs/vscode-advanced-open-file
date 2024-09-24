import { sep } from "node:path";
import { FileType, Uri } from "vscode";
import type { App } from ".";
import { buildFileItems } from "./fileItem";
import { createFileWithDir, getFsRoot, openFile } from "../fsUtils";

export const initOnDidChangeValueHandler = (app: App) => {
  return (value: string) => {
    buildFileItems(value, app.options.groupDirectoriesFirst).then(
      app.actions.setItems,
    );
  };
};

export const initOnHideHandler = (app: App) => {
  return () => {
    app.actions.setValue(Uri.file(""));
    app.actions.setItems([]);
  };
};

export const initOnDidAcceptHandler = (app: App) => {
  return () => {
    const { getValue, getSelectedItem, setValue, showPicker } = app.actions;
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
    const fsRoot = getFsRoot();
    const newFsPath =
      selectedItem.absolutePath +
      (selectedItem.absolutePath === fsRoot ? "" : sep);

    const uri = Uri.file(newFsPath);
    setValue(uri);
    showPicker(uri, app.options);
  };
};
