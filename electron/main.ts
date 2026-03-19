import { app, BrowserWindow, Tray, Menu, nativeImage } from "electron";
import path from "path";
import { ChildProcess, fork } from "child_process";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let serverProcess: ChildProcess | null = null;

const isDev = process.env.NODE_ENV === "development";
const PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${PORT}`;

function startServer(): Promise<void> {
  return new Promise((resolve) => {
    if (isDev) {
      // In dev mode, server is started separately by concurrently
      resolve();
      return;
    }

    // In production, start the Next.js custom server
    const serverPath = path.join(__dirname, "..", "server.js");
    serverProcess = fork(serverPath, [], {
      env: {
        ...process.env,
        NODE_ENV: "production",
        PORT: String(PORT),
      },
    });

    // Wait a bit for server to start
    setTimeout(resolve, 2000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    titleBarStyle: "default",
    title: "ProjectTN",
  });

  mainWindow.loadURL(SERVER_URL);

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show App",
      click: () => mainWindow?.show(),
    },
    {
      label: "Quit",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip("ProjectTN");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    mainWindow?.show();
  });
}

app.whenReady().then(async () => {
  await startServer();
  createWindow();
  createTray();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
