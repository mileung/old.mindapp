import * as path from 'path';
import { app, BrowserWindow, screen } from 'electron';
export const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
	mainWindow = new BrowserWindow({
		webPreferences: {
			devTools: true,
		},
	});

	if (isDev) {
		process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
		const primaryDisplay = screen.getPrimaryDisplay();
		const { width, height } = primaryDisplay.workAreaSize;
		mainWindow.webContents.openDevTools();
		mainWindow.setPosition(0, 0);
		mainWindow.setSize(width / 2, height);
	}

	// Vite dev server URL
	mainWindow.loadURL('http://localhost:5173');
	mainWindow.on('closed', () => (mainWindow = null));
}

app.whenReady().then(() => {
	createWindow();
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (mainWindow == null) {
		createWindow();
	}
});
