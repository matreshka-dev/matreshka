import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";

function loadPackageJson(fromDir: string): { version: string } {
  let dir = fromDir;
  for (;;) {
    try {
      return JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    } catch {
      const parent = dirname(dir);
      if (parent === dir) {
        throw new Error("package.json not found");
      }
      dir = parent;
    }
  }
}

export const version = loadPackageJson(__dirname).version;
