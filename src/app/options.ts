import { workspace } from "vscode";

export type Options = {
  groupDirectoriesFirst: boolean;
};

export const initOptions = (): Options => {
  const groupDirectoriesFirst =
    workspace
      .getConfiguration()
      .get<boolean>("vscode-advanced-open-file.groupDirectoriesFirst") ?? true;

  return {
    groupDirectoriesFirst,
  };
};
