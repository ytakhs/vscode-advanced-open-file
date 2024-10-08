import { basename, dirname, sep as pathSep, join } from "node:path";
import { FileType, Uri, workspace, type QuickPickItem } from "vscode";
import { getFsRoot, isUriExists } from "../fsUtils";

const icons = {
  [FileType.File]: "$(file)",
  [FileType.Directory]: "$(file-directory)",
  [FileType.SymbolicLink | FileType.File]: "$(file-symlink-file)",
  [FileType.SymbolicLink | FileType.Directory]: "$(file-symlink-directory)",
  [FileType.Unknown]: "$(file)",
};

export class FileItem implements QuickPickItem {
  absolutePath: string;
  alwaysShow: boolean;
  label: string;
  filetype: FileType;

  constructor(absolutePath: string, filetype: FileType, label?: string) {
    this.absolutePath = absolutePath;
    this.label = `${icons[filetype]} ${label || basename(absolutePath)}`;
    this.alwaysShow = true;
    this.filetype = filetype;
  }
}

export async function buildFileItems(
  pathname: string,
  isGroupDirectoriesFirst: boolean,
): Promise<ReadonlyArray<FileItem>> {
  let directory = pathname;
  let fragment = "";

  if (!pathname.endsWith(pathSep)) {
    directory = dirname(pathname);
    fragment = basename(pathname);
  }

  const uri = Uri.file(directory);
  let files: [string, FileType][];
  if (await isUriExists(uri)) {
    files = await workspace.fs.readDirectory(uri);
  } else {
    files = [];
  }

  const matchedFiles = files.filter((fileArr) => {
    const f = fileArr[0];
    if (fragment.toLowerCase() === fragment) {
      return f.toLowerCase().startsWith(fragment);
    }

    return f.startsWith(fragment);
  });

  const filePickItems = await Promise.all(
    matchedFiles.map(async (fileArr) => {
      const f = fileArr[0];
      const absolutePath = join(directory, f);
      const uri = Uri.file(absolutePath);
      const fileType = await workspace.fs.stat(uri);

      return new FileItem(absolutePath, fileType.type);
    }),
  );

  // Group directories first if desired
  if (isGroupDirectoriesFirst) {
    filePickItems.sort((fileA, fileB) => {
      if (
        fileA.filetype === FileType.Directory &&
        fileB.filetype !== FileType.Directory
      ) {
        return -1;
      }

      if (
        fileA.filetype !== FileType.Directory &&
        fileB.filetype === FileType.Directory
      ) {
        return 1;
      }

      return 0;
    });
  }

  const fsRoot = getFsRoot();
  if (!fragment && directory !== fsRoot && files.length > 0) {
    const parent = dirname(directory);
    filePickItems.unshift(new FileItem(parent, FileType.Directory, ".."));
  }

  return filePickItems;
}
