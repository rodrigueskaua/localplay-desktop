const { contextBridge, ipcRenderer } = require("electron");

const apiBaseArg = process.argv.find((arg) => arg.startsWith("--localplay-api-base="));
const apiBase = apiBaseArg ? apiBaseArg.split("=")[1] : null;

contextBridge.exposeInMainWorld("localplay", {
  chooseLibraryFolder: () => ipcRenderer.invoke("choose-library-folder"),
  openPath: (filePath) => ipcRenderer.invoke("open-path", filePath),
  showInFolder: (filePath) => ipcRenderer.invoke("show-in-folder", filePath),
  onNavegar: (cb) => ipcRenderer.on("navegar", (_e, rota) => cb(rota)),
  onAdicionarPasta: (cb) => ipcRenderer.on("adicionar-pasta", () => cb()),
  apiBase,
});
