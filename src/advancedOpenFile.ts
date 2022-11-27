import * as os from "os";
import * as Path from "path";
import * as vscode from "vscode";
import { FileType, QuickPick, Uri } from "vscode";
import { FileItem, createFileItems } from "./fileItem";

export class AdvancedOpenFile {
  private currentPath: Uri;
  private picker: QuickPick<FileItem>;

  constructor(uri: Uri) {
    this.picker = this.initPicker();
    this.currentPath = uri;
  }

  async pick() {
    this.show();

    this.picker.value = this.currentPath.fsPath;
    this.picker.items = await createFileItems(this.currentPath.fsPath);
  }

  initPicker(): QuickPick<FileItem> {
    const picker: QuickPick<FileItem> = vscode.window.createQuickPick();
    picker.onDidChangeValue(this.onDidChangeValue.bind(this));
    picker.onDidAccept(this.onDidAccept.bind(this));
    picker.onDidHide(this.onDidHide.bind(this));

    return picker;
  }

  show() {
    this.picker.show();
  }

  dispose() {
    this.picker.dispose();
  }

  onDidChangeValue(value: string) {
    createFileItems(value).then((items: ReadonlyArray<FileItem>) => {
      this.picker.items = items;
    });
  }

  onDidAccept() {
    const pickedItem = this.picker.selectedItems[0];
    const newFilepath = this.picker.value;

    if (pickedItem) {
      if (pickedItem.filetype === FileType.File) {
        this.currentPath = Uri.file(pickedItem.absolutePath);
        this.openFile();
      } else {
        const fsRoot =
          os.platform() === "win32" ? process.cwd().split(Path.sep)[0] : "/";
        const path =
          pickedItem.absolutePath +
          (pickedItem.absolutePath === fsRoot ? "" : Path.sep);
        this.currentPath = Uri.file(path);
        this.pick();
      }
    } else {
      this.currentPath = Uri.file(newFilepath);
      this.createFile();
    }
  }

  onDidHide() {
    this.dispose();
  }

  createFile() {
    this.dispose();

    const path = this.currentPath.fsPath;
    const parts = path.split(Path.sep);
    const fragment = parts[parts.length - 1];
    const directory = Uri.file(
      path.substring(0, path.length - fragment.length)
    );

    vscode.workspace.fs.createDirectory(directory).then(() => {
      const uri = Uri.file(path);
      const content = new Uint8Array(0);
      vscode.workspace.fs.writeFile(uri, content).then(() => this.openFile());
    });
  }

  openFile() {
    this.dispose();

    vscode.workspace.openTextDocument(this.currentPath).then((document) => {
      vscode.window.showTextDocument(document);
    });
  }
}
