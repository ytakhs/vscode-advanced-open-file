import * as path from "path";
import * as os from "os";
import * as vscode from "vscode";
import { FileType, Uri, QuickPickItem } from "vscode";

const icons = {
  [FileType.File]: "$(file)",
  [FileType.Directory]: "$(file-directory)",
  [FileType.SymbolicLink]: "$(file-symlink-file)",
  [FileType.Unknown]: "$(file)",
};

export class FileItem implements QuickPickItem {
  absolutePath: string;
  alwaysShow: boolean;
  label: string;
  detail: string;
  description: string;
  filetype: FileType;

  constructor(absolutePath: string, filetype: FileType, label?: string) {
    this.absolutePath = absolutePath;
    this.label = `${icons[filetype]} ${label || path.basename(absolutePath)}`;
    this.alwaysShow = true;
    this.filetype = filetype;
  }
}

export async function createFileItems(pathname: string): Promise<ReadonlyArray<FileItem>> {
  let directory = pathname;
  let fragment = "";

  if (!pathname.endsWith(path.sep)) {
    directory = path.dirname(pathname);
    fragment = path.basename(pathname);
  }

  const uri = Uri.file(directory);
  let filePickItems: Array<FileItem>;

  const files = await vscode.workspace.fs.readDirectory(uri);
  let matchedFiles = files.filter(fileArr => {
    const f = fileArr[0];
    if (fragment.toLowerCase() === fragment) {
      return f.toLowerCase().startsWith(fragment);
    }

    return f.startsWith(fragment);
  });

  filePickItems = await Promise.all(
    matchedFiles.map(async fileArr => {
      const f = fileArr[0];
      const absolutePath = path.join(directory, f);
      const uri = Uri.file(absolutePath);
      const fileType = await vscode.workspace.fs.stat(uri);

      return new FileItem(absolutePath, fileType.type);
    })
  );

  // Group directories first if desired
  if (vscode.workspace.getConfiguration().get("vscode-advanced-open-file.groupDirectoriesFirst")) {
    filePickItems.sort((fileA, fileB) => {
      if (fileA.filetype === FileType.Directory && fileB.filetype !== FileType.Directory) {
        return -1;
      } else if (fileA.filetype !== FileType.Directory && fileB.filetype === FileType.Directory) {
        return 1;
      }

      return 0;
    });
  }

  const fsRoot = os.platform() === "win32" ? process.cwd().split(path.sep)[0] : "/";
  if (!fragment && directory !== fsRoot) {
    const parent = path.dirname(directory);
    filePickItems.unshift(new FileItem(parent, FileType.Directory, ".."));
  }

  return filePickItems;
}
