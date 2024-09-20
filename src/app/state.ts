import { window, type QuickPick, type Uri } from "vscode";
import type { FileItem } from "../fileItem";

export type State = {
  picker: QuickPick<FileItem>;
  currentUri: Uri;
};

export const initState = ({ currentUri }: { currentUri: Uri }) => {
  return {
    picker: window.createQuickPick<FileItem>(),
    currentUri,
  };
};
