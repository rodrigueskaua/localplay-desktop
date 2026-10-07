const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { Arch } = require("electron-builder");

const IGNORAR = new Set([".bin", ".cache", ".DS_Store"]);

function instalarSqliteParaArquitetura(modulo, arquitetura, versaoElectron) {
  const prebuild = path.join(__dirname, "..", "..", "backend", "node_modules", "prebuild-install", "bin.js");

  fs.rmSync(path.join(modulo, "build"), { recursive: true, force: true });

  execFileSync(
    process.execPath,
    [prebuild, "--runtime", "electron", "--target", versaoElectron, "--arch", arquitetura, "--platform", "darwin"],
    { cwd: modulo, stdio: "inherit" }
  );

  const binario = path.join(modulo, "build", "Release", "better_sqlite3.node");
  if (!fs.existsSync(binario)) {
    throw new Error(`better-sqlite3 para ${arquitetura} nao foi instalado em ${modulo}`);
  }
}

module.exports = async function afterPack(context) {
  const src = path.join(__dirname, "..", "..", "backend", "node_modules");
  const dest = path.join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.app`,
    "Contents",
    "Resources",
    "backend",
    "node_modules"
  );

  fs.cpSync(src, dest, {
    recursive: true,
    filter: (origem) => !IGNORAR.has(path.basename(origem)),
  });

  const arquitetura = Arch[context.arch];
  if (arquitetura !== process.arch) {
    const { version } = require("electron/package.json");
    instalarSqliteParaArquitetura(path.join(dest, "better-sqlite3"), arquitetura, version);
  }

  console.log(`[afterPack] dependencias do backend copiadas para ${dest} (${arquitetura})`);
};
