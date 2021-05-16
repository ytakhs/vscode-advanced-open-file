"use strict";
import { window, FileType, QuickPick, QuickPickItem, workspace, WorkspaceFolder, Disposable, Uri } from "vscode";

import * as path from "path";
import * as os from "os";

const pathSeparator = path.sep;
const fsRoot = os.platform() === "win32" ? process.cwd().split(path.sep)[0] : "/";
const icons = {
  [FileType.File]: "$(file)",
  [FileType.Directory]: "$(file-directory)",
  [FileType.SymbolicLink]: "$(file-symlink-file)",
  [FileType.Unknown]: "$(file)",
};

class FilePickItem implements QuickPickItem {
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

async function createFilePickItems(value: string): Promise<ReadonlyArray<QuickPickItem>> {
  let directory = value;
  let fragment = "";
  if (!value.endsWith(pathSeparator)) {
    directory = path.dirname(value);
    fragment = path.basename(value);
  }

  const uri = Uri.file(directory);
  let filePickItems: Array<FilePickItem>;

  try {
    const files = await workspace.fs.readDirectory(uri);
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
        const fileType = await workspace.fs.stat(uri);

        return new FilePickItem(absolutePath, fileType.type);
      })
    );

    // Group directories first if desired
    if (workspace.getConfiguration().get("vscode-advanced-open-file.groupDirectoriesFirst")) {
      filePickItems.sort((fileA, fileB) => {
        if (fileA.filetype === FileType.Directory && fileB.filetype !== FileType.Directory) {
          return -1;
        } else if (fileA.filetype !== FileType.Directory && fileB.filetype === FileType.Directory) {
          return 1;
        }

        return 0;
      });
    }

    if (!fragment && directory !== fsRoot) {
      const parent = path.dirname(directory);
      filePickItems.unshift(new FilePickItem(parent, FileType.Directory, ".."));
    }
  } catch (e) {
    filePickItems = [];
  } finally {
    return filePickItems;
  }
}

function createFilePicker(value: string, items: ReadonlyArray<QuickPickItem>): QuickPick<QuickPickItem> {
  const quickpick = window.createQuickPick();
  quickpick.items = items;
  quickpick.placeholder = "select file";

  return quickpick;
}

async function pickFile(value: string, items: ReadonlyArray<QuickPickItem>): Promise<QuickPickItem | string> {
  const quickpick = createFilePicker(value, items);
  const disposables: Disposable[] = [];

  try {
    quickpick.show();

    quickpick.value = value;

    const pickedItem = await new Promise<QuickPickItem | string>(resolve => {
      disposables.push(
        quickpick.onDidChangeValue(value => {
          createFilePickItems(value).then(items => {
            quickpick.items = items;
          });
        })
      );

      disposables.push(
        quickpick.onDidAccept(() => {
          if (quickpick.selectedItems[0]) {
            resolve(quickpick.selectedItems[0]);
          } else {
            resolve(quickpick.value);
          }
        })
      );
    });

    quickpick.hide();

    if (typeof pickedItem === "string") {
      return pickedItem;
    } else if (pickedItem instanceof FilePickItem) {
      if (pickedItem.filetype === FileType.Directory) {
        const directory = pickedItem.absolutePath + (pickedItem.absolutePath === fsRoot ? "" : pathSeparator);
        const items = await createFilePickItems(directory);
        return pickFile(directory, items);
      } else {
        return pickedItem;
      }
    }
  } finally {
    quickpick.dispose();
    disposables.forEach(d => d.dispose());
  }
}

async function createFile(path: string): Promise<void> {
  const uri = Uri.file(path);
  const content = new Uint8Array(0);
  try {
    await workspace.fs.writeFile(uri, content);
  } catch (e) {
    throw new Error(e);
  }
}

async function createDir(dir: string): Promise<void> {
  const uri = Uri.file(dir);
  try {
    await workspace.fs.createDirectory(uri);
  } catch (e) {
    throw new Error(e);
  }
}

async function openFile(path: string): Promise<void> {
  const document = await workspace.openTextDocument(path);
  if (!document) {
    throw new Error("no such file exists");
  }

  const editor = await window.showTextDocument(document);
  if (!editor) {
    throw new Error("showing document failed.");
  }
}

async function advancedOpen(startingPoint: string) {
  startingPoint += pathSeparator;

  const filePickItems = await createFilePickItems(startingPoint);
  const pickedItem = await pickFile(startingPoint, filePickItems);

  if (!pickedItem) {
    throw new Error("failed");
  }

  if (typeof pickedItem === "string") {
    const newFilePath = pickedItem;
    try {
      const parts = newFilePath.split(pathSeparator);
      const fragment = parts[parts.length - 1];
      const direcotry = newFilePath.substring(0, newFilePath.length - fragment.length);

      await createDir(direcotry);
      await createFile(newFilePath);
    } catch (err) {
      window.showWarningMessage(err);
    }

    try {
      await openFile(newFilePath);
    } catch (err) {
      window.showWarningMessage(err);
    }
  } else if (pickedItem instanceof FilePickItem) {
    try {
      await openFile(pickedItem.absolutePath);
    } catch (err) {
      window.showWarningMessage(err);
    }
  }
}

async function pickWorkspace(): Promise<string> {
  const targetWorkspaceFolder: WorkspaceFolder | undefined = await window.showWorkspaceFolderPick();
  if (targetWorkspaceFolder === undefined) {
    throw new Error("No workspace is opened.");
  }

  return targetWorkspaceFolder.uri.path;
}

async function pathToCurrentDirectory(): Promise<string> {
  const currentEditor = window.activeTextEditor;
  if (currentEditor) {
    return path.dirname(currentEditor.document.uri.path);
  }

  return pickWorkspace();
}

async function pathToCurrentWorkspace(): Promise<string> {
  const currentEditor = window.activeTextEditor;
  if (currentEditor) {
    return workspace.getWorkspaceFolder(currentEditor.document.uri).uri.path;
  }

  return pickWorkspace();
}

export async function advancedOpenFile() {
  advancedOpen(await pathToCurrentDirectory());
}

export async function advancedOpenWorkspaceFile() {
  advancedOpen(await pathToCurrentWorkspace());
}
