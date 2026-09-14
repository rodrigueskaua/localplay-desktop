import { existsSync } from "fs";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const electronPkgPath = resolve(__dirname, "..", "..", "electron", "node_modules", "electron", "package.json");

if (!existsSync(electronPkgPath)) {
  process.exit(0);
}

const { version } = JSON.parse(await import("fs").then((fs) => fs.readFileSync(electronPkgPath, "utf-8")));

execFileSync(
  "npx",
  ["electron-rebuild", `--version=${version}`, "--module-dir=.", "--only=better-sqlite3"],
  { cwd: resolve(__dirname, ".."), stdio: "inherit" }
);
