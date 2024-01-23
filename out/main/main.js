"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
require("path");
const electron = require("electron");
const isDev = process.env.NODE_ENV === "development";
let mainWindow;
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    webPreferences: {
      devTools: true
    }
  });
  if (isDev) {
    process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";
    const primaryDisplay = electron.screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    mainWindow.webContents.openDevTools();
    mainWindow.setPosition(0, 0);
    mainWindow.setSize(width / 2, height);
  }
  mainWindow.loadURL("http://localhost:5173");
  mainWindow.on("closed", () => mainWindow = null);
}
electron.app.whenReady().then(() => {
  createWindow();
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("activate", () => {
  if (mainWindow == null) {
    createWindow();
  }
});
exports.isDev = isDev;
