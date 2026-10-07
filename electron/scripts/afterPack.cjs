const fs = require("fs");
const path = require("path");

const IGNORAR = new Set([".bin", ".cache", ".DS_Store"]);

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

  console.log(`[afterPack] dependencias do backend copiadas para ${dest}`);
};
