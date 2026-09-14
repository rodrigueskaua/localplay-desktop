const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("localplay", {
  chooseLibraryFolder: () => ipcRenderer.invoke("choose-library-folder"),
});
