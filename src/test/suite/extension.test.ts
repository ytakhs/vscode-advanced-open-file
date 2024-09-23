import * as assert from "node:assert";
import * as path from "node:path";
import { commands, Uri, window, workspace } from "vscode";
import { isUriExists } from "../../fsUtils";
import { initApp } from "../../app";
import { initOptions } from "../../app/options";

const testWorkspace = Uri.file(path.resolve(".test-workspace"));

suite("AdvancedOpenFile", () => {
  test("Open a file", async () => {
    const app = initApp();
    app.actions.showPicker(testWorkspace, initOptions());
    const v = app.actions.getValue();
    app.actions.setValue(Uri.joinPath(v, "foo.txt"));
    await commands.executeCommand("workbench.action.quickOpenSelectNext");
    await commands.executeCommand(
      "workbench.action.acceptSelectedQuickOpenItem",
    );

    await sleep(1000);

    assert.notEqual(window.activeTextEditor, undefined);
  });

  test("Create a file with directory", async () => {
    await cleanTestTmpDir();

    const app = initApp();
    app.actions.showPicker(testWorkspace, initOptions());
    const v = app.actions.getValue();
    app.actions.setValue(Uri.joinPath(v, "tmp", "foo", "bar", "foo.txt"));

    await commands.executeCommand(
      "workbench.action.acceptSelectedQuickOpenItem",
    );

    await sleep(1000);

    assert.equal(
      await isUriExists(
        Uri.joinPath(testWorkspace, "tmp", "foo", "bar", "foo.txt"),
      ),
      true,
    );

    await cleanTestTmpDir();
  });
});

const sleep = async (ms: number): Promise<void> => {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
};

const cleanTestTmpDir = async (): Promise<void> => {
  await workspace.fs.delete(Uri.joinPath(testWorkspace, "/tmp"), {
    recursive: true,
  });
};
