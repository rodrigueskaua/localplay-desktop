const { contextBridge, ipcRenderer } = require("electron");

const apiBaseArg = process.argv.find((arg) => arg.startsWith("--localplay-api-base="));
const apiBase = apiBaseArg ? apiBaseArg.split("=")[1] : null;

contextBridge.exposeInMainWorld("localplay", {
  chooseLibraryFolder: () => ipcRenderer.invoke("choose-library-folder"),
  apiBase,
});
