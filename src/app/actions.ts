import { Uri } from "vscode";
import { createFileItems, type FileItem } from "../fileItem";
import type { Options } from "./options";
import type { State } from "./state";

export type Actions = {
  pick: (uri: Uri) => Promise<void>;
  getSelectedItem: () => FileItem | undefined;
  getValue: () => Uri;
  setValue: (uri: Uri) => void;
  setItems: (items: ReadonlyArray<FileItem>) => void;
};

type ActionParams = {
  state: State;
  options: Options;
};

export const initActions = (state: State, options: Options): Actions => {
  return {
    pick: initPick({ state, options }),
    getSelectedItem: () => state.picker.selectedItems[0],
    getValue: () => Uri.file(state.picker.value),
    setValue: initSetValue({ state, options }),
    setItems: (items: ReadonlyArray<FileItem>) => {
      state.picker.items = items;
    },
  };
};

const initPick = ({ state: { picker } }: ActionParams) => {
  return async (uri: Uri) => {
    picker.show();
    picker.value = uri.fsPath;
    picker.items = await createFileItems(uri.fsPath);
  };
};

const initSetValue = ({ state }: ActionParams) => {
  return (uri: Uri) => {
    state.picker.value = uri.fsPath;
  };
};
