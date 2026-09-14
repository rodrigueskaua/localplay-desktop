const fs = require("fs");
const path = require("path");

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

  fs.cpSync(src, dest, { recursive: true });
  console.log(`[afterPack] node_modules copiado para ${dest}`);
};
