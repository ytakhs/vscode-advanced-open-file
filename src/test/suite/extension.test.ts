import { commands, Uri, window, workspace } from "vscode";
import { AdvancedOpenFile } from "../../advancedOpenFile";
import assert = require("node:assert");
import path = require("node:path");
import { isUriExists } from "../../fsUtils";

const testWorkspace = Uri.file(path.resolve(".test-workspace"));

suite("AdvancedOpenFile", () => {
  test("Open a file", async () => {
    const aof = new AdvancedOpenFile(testWorkspace);
    aof.pick();
    aof.appendValue("/foo.txt");
    await commands.executeCommand("workbench.action.quickOpenSelectNext");
    await commands.executeCommand(
      "workbench.action.acceptSelectedQuickOpenItem",
    );

    await sleep(1000);

    assert.notEqual(window.activeTextEditor, undefined);
  });

  test("Create a file with directory", async () => {
    await cleanTestTmpDir();

    const aof = new AdvancedOpenFile(testWorkspace);

    aof.pick();

    aof.appendValue("/tmp/foo/bar/foo.txt");

    await commands.executeCommand("workbench.action.quickOpenSelectNext");
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
