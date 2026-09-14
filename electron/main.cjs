const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const { pathToFileURL } = require("url");

const userData = app.getPath("userData");
process.env.COVERS_DIR = path.join(userData, "covers");
process.env.DB_PATH = path.join(userData, "progress.db");
process.env.PORT = "8000";

let mainWindow;

async function waitForFrontend(url, attempts = 30) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  const frontendUrl = process.env.LOCALPLAY_FRONTEND_URL ?? "http://localhost:3000";
  if (!app.isPackaged) await waitForFrontend(frontendUrl);
  mainWindow.loadURL(frontendUrl);
}

ipcMain.handle("choose-library-folder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});

app.whenReady().then(async () => {
  const serverPath = path.join(__dirname, "..", "backend", "src", "server.js");
  await import(pathToFileURL(serverPath).href);
  await createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
