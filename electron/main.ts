import { app, BrowserWindow, Menu } from "electron";
import path from "path";
import { ChildProcess, spawn } from "child_process";
import fs from "fs";

// Must be called before app.whenReady()
app.disableHardwareAcceleration();

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

const isDev = process.env.NODE_ENV === "development";
const PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${PORT}`;

function log(msg: string) {
  try {
    const logDir = app.getPath("userData");
    fs.mkdirSync(logDir, { recursive: true });
    const logPath = path.join(logDir, "smap.log");
    const line = `[${new Date().toISOString()}] ${msg}\n`;
    fs.appendFileSync(logPath, line);
  } catch {
    // Silently fail if logging fails
  }
}

function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isDev) {
      resolve();
      return;
    }

    // Use Next.js standalone server (self-contained with all dependencies)
    // extraResources copies standalone to: resources/standalone/
    const standaloneDir = path.join(process.resourcesPath, "standalone");
    const serverPath = path.join(standaloneDir, "server.js");

    log(`Starting server from: ${serverPath}`);
    log(`Standalone dir exists: ${fs.existsSync(standaloneDir)}`);
    log(`Server.js exists: ${fs.existsSync(serverPath)}`);

    // Use spawn with Node.js (Electron bundles Node runtime via process.execPath
    // won't work for non-Electron scripts; use the system node or fork approach)
    serverProcess = spawn(process.execPath, ["--no-warnings", serverPath], {
      cwd: standaloneDir,
      env: {
        ...process.env,
        NODE_ENV: "production",
        PORT: String(PORT),
        HOSTNAME: "localhost",
        ELECTRON_RUN_AS_NODE: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    serverProcess.stdout?.on("data", (data: Buffer) => {
      log(`[server stdout] ${data.toString().trim()}`);
    });

    serverProcess.stderr?.on("data", (data: Buffer) => {
      log(`[server stderr] ${data.toString().trim()}`);
    });

    serverProcess.on("error", (err) => {
      log(`Server process error: ${err.message}`);
      reject(err);
    });

    serverProcess.on("exit", (code) => {
      log(`Server process exited with code: ${code}`);
    });

    // Poll until server is up (max 15s)
    let elapsed = 0;
    const check = setInterval(async () => {
      elapsed += 500;
      try {
        const res = await fetch(SERVER_URL);
        if (res.ok || res.status < 500) {
          clearInterval(check);
          log("Server is ready");
          resolve();
        }
      } catch {
        if (elapsed > 15000) {
          clearInterval(check);
          log("Server timeout, proceeding anyway");
          resolve();
        }
      }
    }, 500);
  });
}

function createWindow() {
  // Hide the default menu bar
  Menu.setApplicationMenu(null);

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
    autoHideMenuBar: true,
    title: "SMAP",
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


app.whenReady().then(async () => {
  log(`App ready. isDev: ${isDev}, resourcesPath: ${process.resourcesPath}`);
  try {
    await startServer();
  } catch (err) {
    log(`Failed to start server: ${err}`);
  }
  createWindow();

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
