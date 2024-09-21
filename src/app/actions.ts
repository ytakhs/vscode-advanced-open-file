import { Uri } from "vscode";
import { createFileItems, type FileItem } from "../fileItem";
import type { Options } from "./options";
import type { State } from "./state";

export type Actions = {
  pick: () => Promise<void>;
  getUri: () => Uri;
  setUri: (uri: Uri) => void;
  joinUri: (...pathSegments: string[]) => void;
  setItems: (items: ReadonlyArray<FileItem>) => void;
};

type ActionParams = {
  state: State;
  options: Options;
};

export const initActions = (state: State, options: Options): Actions => {
  return {
    pick: initPick({ state, options }),
    getUri: () => state.currentUri,
    setUri: initSetUri({ state, options }),
    joinUri: initJoinUri({ state, options }),
    setItems: (items: ReadonlyArray<FileItem>) => {
      state.picker.items = items;
    },
  };
};

const initPick = ({ state: { picker, currentUri } }: ActionParams) => {
  return async () => {
    picker.show();
    picker.value = currentUri.fsPath;
    picker.items = await createFileItems(currentUri.fsPath);
  };
};

const initSetUri = ({ state }: ActionParams) => {
  return (uri: Uri) => {
    state.picker.value = uri.fsPath;
    state.currentUri = uri;
  };
};

const initJoinUri = ({ state }: ActionParams) => {
  return (...pathSegments: string[]) => {
    const uri = Uri.joinPath(state.currentUri, ...pathSegments);

    state.picker.value = uri.fsPath;
    state.currentUri = uri;
  };
};
