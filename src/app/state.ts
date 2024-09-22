import { window, type QuickPick } from "vscode";
import type { FileItem } from "./fileItem";

export type State = {
  picker: QuickPick<FileItem>;
};

export const initState = () => {
  return {
    picker: window.createQuickPick<FileItem>(),
  };
};
