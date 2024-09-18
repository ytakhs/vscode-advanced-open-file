import { resolve } from "node:path";
import { glob } from "glob";

export function run(): Promise<void> {
  const mocha = new Mocha({
    ui: "tdd",
  });

  mocha.options.color = true;

  const testsRoot = resolve(__dirname, "..");

  return new Promise((c, e) => {
    glob("**/**.test.js", { cwd: testsRoot })
      .then((files) => {
        // Add files to the test suite
        for (const f of files) {
          mocha.addFile(resolve(testsRoot, f));
        }

        try {
          // Run the mocha test
          mocha.run((failures) => {
            if (failures > 0) {
              e(new Error(`${failures} tests failed.`));
            } else {
              c();
            }
          });
        } catch (err) {
          e(err);
        }
      })
      .catch((err) => e(err));
  });
}
