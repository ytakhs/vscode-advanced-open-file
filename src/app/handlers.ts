import { dirname } from "node:path";
import { FileType, Uri } from "vscode";
import type { App } from ".";
import { createFileItems } from "../fileItem";
import { createFileWithDir, openFile } from "../fsUtils";

export const initOnDidChangeValue = (app: App) => {
  return (value: string) => {
    createFileItems(value).then(app.actions.setItems);
  };
};

export const initOnDidAccept = (app: App) => {
  return () => {
    const { getCurrentValue, getSelectedItem, setUri, pick } = app.actions;
    const selectedItem = getSelectedItem();

    // no existing file or directory, so create a new file.
    if (selectedItem === undefined) {
      const currentValue = getCurrentValue();
      const newUri = Uri.file(currentValue);

      createFileWithDir(newUri, new Uint8Array(0)).then(() => setUri(newUri));

      return;
    }

    // open if it's a file
    if ((selectedItem.filetype & FileType.File) > 0) {
      const uri = Uri.file(selectedItem.absolutePath);
      openFile(uri).then(() => setUri(uri));

      return;
    }

    // continue picking if it's a directory
    const uri = Uri.file(dirname(selectedItem.absolutePath));
    setUri(uri);
    pick();
  };
};
