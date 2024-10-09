import { sep } from "node:path";
import { FileType, Uri, window } from "vscode";
import { INITIAL_VALUE, type App } from ".";
import { buildFileItems } from "./fileItem";
import {
  createFileWithDir,
  getFileType,
  getFsRoot,
  openFile,
} from "../fsUtils";
import { handleError } from "./error";

export const initOnDidChangeValueHandler = (app: App) => {
  return (value: string) => {
    if (value === INITIAL_VALUE) {
      return;
    }

    buildFileItems(value, app.options.groupDirectoriesFirst).then(
      app.actions.setItems,
    );
  };
};

export const initOnHideHandler = (app: App) => {
  return () => {
    app.actions.setValue(INITIAL_VALUE);
    app.actions.setItems([]);
  };
};

export const initOnDidAcceptHandler = (app: App) => {
  return () => {
    const { getValue, getSelectedItem, setValue, showPicker, hidePicker } =
      app.actions;
    const selectedItem = getSelectedItem();

    // no existing file or directory, so create a new file.
    if (selectedItem === undefined) {
      const newValue = getValue();
      const newUri = Uri.file(newValue);

      createFileWithDir(newUri, new Uint8Array(0))
        .then((uri) => {
          setValue(uri.fsPath);

          return uri;
        })
        .then(getFileType)
        .then((fileType) => {
          if (fileType.isFile) {
            return openFile(newUri);
          }

          window.showInformationMessage(`created: ${newUri.fsPath}`);
          hidePicker();

          return;
        })
        .catch(handleError);

      return;
    }

    // open if it's a file
    if ((selectedItem.filetype & FileType.File) > 0) {
      const uri = Uri.file(selectedItem.absolutePath);
      openFile(uri)
        .then(() => setValue(uri.fsPath))
        .catch(handleError);

      return;
    }

    // continue picking if it's a directory
    const fsRoot = getFsRoot();
    const newFsPath =
      selectedItem.absolutePath +
      (selectedItem.absolutePath === fsRoot ? "" : sep);

    const uri = Uri.file(newFsPath);
    setValue(uri.fsPath);
    showPicker(uri, app.options);
  };
};
