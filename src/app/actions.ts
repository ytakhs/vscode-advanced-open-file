import { Uri } from "vscode";
import { createFileItems, type FileItem } from "./fileItem";
import type { State } from "./state";
import type { Options } from "./options";

export type Actions = {
  showPicker: (uri: Uri, options: Options) => Promise<void>;
  getSelectedItem: () => FileItem | undefined;
  getValue: () => Uri;
  setValue: (uri: Uri) => void;
  setItems: (items: ReadonlyArray<FileItem>) => void;
};

type ActionParams = {
  state: State;
};

export const initActions = (state: State): Actions => {
  return {
    showPicker: initShowPicker({ state }),
    getSelectedItem: () => state.picker.selectedItems[0],
    getValue: () => Uri.file(state.picker.value),
    setValue: initSetValue({ state }),
    setItems: (items: ReadonlyArray<FileItem>) => {
      state.picker.items = items;
    },
  };
};

const initShowPicker = ({ state: { picker } }: ActionParams) => {
  return async (uri: Uri, options: Options) => {
    picker.show();
    picker.value = uri.fsPath;
    picker.items = await createFileItems(
      uri.fsPath,
      options.groupDirectoriesFirst,
    );
    picker.selectedItems = [];
  };
};

const initSetValue = ({ state }: ActionParams) => {
  return (uri: Uri) => {
    state.picker.value = uri.fsPath;
  };
};
