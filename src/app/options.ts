import { workspace } from "vscode";

export type Options = {
  groupDirectoriesFirst: boolean;
};

export const initOptions = (): Options => {
  const config = workspace.getConfiguration("vscode-advanced-open-file");

  const groupDirectoriesFirst =
    config.get<boolean>("groupDirectoriesFirst") ?? false;

  const options = {
    groupDirectoriesFirst,
  };

  console.debug("Options initialized:", options);

  return options;
};
