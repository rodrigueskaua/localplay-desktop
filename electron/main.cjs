const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const { aplicarMenu } = require("./menu.cjs");
const path = require("path");
const http = require("http");
const fs = require("fs");
const { pathToFileURL } = require("url");

const userData = app.getPath("userData");
process.env.COVERS_DIR = path.join(userData, "covers");
process.env.DB_PATH = path.join(userData, "progress.db");

let mainWindow;

async function waitForUrl(url, attempts = 30) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
}

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function startStaticServer(rootDir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split("?")[0]);
      let filePath = path.join(rootDir, urlPath);

      if (!filePath.startsWith(rootDir)) {
        res.writeHead(403);
        return res.end();
      }

      fs.stat(filePath, (err, stat) => {
        if (err || !stat.isFile()) {
          filePath = path.join(rootDir, "200.html");
        }
        const ext = path.extname(filePath);
        res.writeHead(200, { "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream" });
        fs.createReadStream(filePath).pipe(res);
      });
    });

    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function createWindow(frontendUrl, apiBase) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 860,
    minHeight: 560,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 18, y: 18 },
    vibrancy: "sidebar",
    visualEffectState: "active",
    backgroundColor: "#1e2023",
    icon: path.join(__dirname, "build", "icon.icns"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      additionalArguments: [`--localplay-api-base=${apiBase}`],
    },
  });

  mainWindow.webContents.on("console-message", (_e, level, message, line, sourceId) => {
    console.log(`[renderer] ${message} (${sourceId}:${line})`);
  });
  mainWindow.webContents.on("did-fail-load", (_e, code, desc, url) => {
    console.log(`[did-fail-load] ${code} ${desc} ${url}`);
  });

  mainWindow.loadURL(frontendUrl);

  const prefsPath = path.join(userData, "prefs.json");
  const idiomaStore = {
    get() {
      try {
        return JSON.parse(fs.readFileSync(prefsPath, "utf8")).idioma ?? null;
      } catch {
        return null;
      }
    },
    set(valor) {
      try {
        fs.writeFileSync(prefsPath, JSON.stringify({ idioma: valor }));
      } catch {}
    },
  };

  aplicarMenu({
    window: mainWindow,
    store: idiomaStore,
    onNavigate: (rota) => mainWindow?.webContents.send("navegar", rota),
    onAddFolder: () => mainWindow?.webContents.send("adicionar-pasta"),
  });
}

ipcMain.handle("open-path", async (_event, filePath) => {
  if (typeof filePath !== "string" || !filePath) return { ok: false };
  const erro = await shell.openPath(filePath);
  return erro ? { ok: false, erro } : { ok: true };
});

ipcMain.handle("show-in-folder", async (_event, filePath) => {
  if (typeof filePath !== "string" || !filePath) return { ok: false };
  shell.showItemInFolder(filePath);
  return { ok: true };
});

ipcMain.handle("choose-library-folder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});

app.whenReady().then(async () => {
  const backendRoot = app.isPackaged
    ? path.join(process.resourcesPath, "backend")
    : path.join(__dirname, "..", "backend");
  const serverPath = path.join(backendRoot, "src", "server.js");
  const backend = await import(pathToFileURL(serverPath).href);
  const apiBase = `http://127.0.0.1:${backend.address.port}`;

  let frontendUrl;
  if (app.isPackaged) {
    const staticRoot = path.join(process.resourcesPath, "frontend");
    const staticServer = await startStaticServer(staticRoot);
    frontendUrl = `http://127.0.0.1:${staticServer.address().port}`;
  } else {
    frontendUrl = "http://localhost:3000";
    await waitForUrl(frontendUrl);
  }

  await createWindow(frontendUrl, apiBase);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
