import type { Uri } from "vscode";
import { buildFileItems, type FileItem } from "./fileItem";
import type { State } from "./state";
import type { Options } from "./options";

export type Actions = {
  showPicker: (uri: Uri, options: Options) => Promise<void>;
  hidePicker: () => void;
  getSelectedItem: () => FileItem | undefined;
  getValue: () => string;
  setValue: (value: string) => void;
  setItems: (items: ReadonlyArray<FileItem>) => void;
};

type ActionParams = {
  state: State;
};

export const initActions = (state: State): Actions => {
  return {
    showPicker: initShowPicker({ state }),
    hidePicker: () => state.picker.hide(),
    getSelectedItem: () => state.picker.selectedItems[0],
    getValue: () => state.picker.value,
    setValue: (value: string) => {
      state.picker.value = value;
    },
    setItems: (items: ReadonlyArray<FileItem>) => {
      state.picker.items = items;
    },
  };
};

const initShowPicker = ({ state: { picker } }: ActionParams) => {
  return async (uri: Uri, options: Options) => {
    picker.show();
    picker.value = uri.fsPath;
    picker.items = await buildFileItems(
      uri.fsPath,
      options.groupDirectoriesFirst,
    );
    picker.selectedItems = [];
  };
};
