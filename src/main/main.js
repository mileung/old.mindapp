import { app, BrowserWindow, dialog, Menu, screen } from 'electron';
import Store from 'electron-store';
import * as path from 'path';
export const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
app.whenReady().then(() => {
	// console.log('app.getAppPath():', app.getAppPath());
	mainWindow = new BrowserWindow({
		titleBarStyle: 'hiddenInset',
		minWidth: 400,
		minHeight: 300,
		webPreferences: {
			devTools: true,
			nodeIntegration: true,
			preload: path.join(app.getAppPath(), 'src/preload/preload.js'),
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

	const navigateToRoute = (route) => {
		// const history = useHistory();
		// history.push(route);
		mainWindow.webContents.send('go-to', route);
	};

	const handleQuit = () => {
		const quitting =
			0 ===
			dialog.showMessageBoxSync({
				type: 'question',
				buttons: ['Quit', 'Cancel'],
				title: 'Confirm Quit',
				message: 'Are you sure you want to quit Mindapp?',
			});
		if (quitting) {
			app.quit();
		}
	};

	const menuTemplate = [
		{
			label: 'Mindapp',
			submenu: [
				{ label: 'About Mindapp', click: () => navigateToRoute('/about') },
				{ type: 'separator' },
				{
					label: 'Preferences',
					accelerator: 'CmdOrCtrl+,',
					click: () => navigateToRoute('/preferences'),
				},
				{ type: 'separator' },
				{ label: 'Hide Mindapp', role: 'hide' },
				{ label: 'Hide Others', role: 'hideothers' },
				{ type: 'separator' },
				{ label: 'Warn before quitting Mindapp', type: 'checkbox' },
				{ type: 'separator' },
				{ label: 'Quit Mindapp', accelerator: 'CmdOrCtrl+Q', click: handleQuit },
			],
		},
		{
			label: 'File',
			submenu: [
				{
					label: 'New Thought',
					accelerator: 'CmdOrCtrl+N',
					click: () => navigateToRoute('/new-thought'),
				},
				{
					label: 'New Category',
					accelerator: 'CmdOrCtrl+Shift+N',
					click: () => navigateToRoute('/new-thought'),
				},
			],
		},
		{
			label: 'Edit',
			submenu: [
				{ label: 'Undo', role: 'undo' },
				{ label: 'Redo', role: 'redo' },
				{ type: 'separator' },
				{ label: 'Cut', role: 'cut' },
				{ label: 'Copy', role: 'copy' },
				{ label: 'Paste', role: 'paste' },
			],
		},
		{
			label: 'Selection',
			submenu: [
				{ label: 'Select All', role: 'selectall' },
				{ type: 'separator' },
				{
					label: 'Find',
					accelerator: 'CmdOrCtrl+F',
					click: () => null,
				},
				{
					label: 'Find in Thoughts',
					accelerator: 'CmdOrCtrl+Shift+F',
					click: () => null,
				},
			],
		},
		{
			label: 'Window',
			submenu: [
				{ label: 'Minimize', role: 'minimize' },
				{ label: 'Reload', role: 'reload' },
			],
		},
	];

	const menu = Menu.buildFromTemplate(menuTemplate);
	Menu.setApplicationMenu(menu);

	// ipcMain.handle('my-invokable-ipc', async (event, ...args) => {
	// 	const result = await somePromise(...args);
	// 	return result;
	// });
	(async () => {
		try {
			// code ~/Library/Application\ Support/mindapp/config.json
			const store = new Store({
				name: 'config',
				schema: {
					mindappRoot: { type: 'string' },
				},
				defaults: {
					mindappRoot: '',
				},
			});

			const data = store.get('mindappRoot');

			console.log('data', data);

			mainWindow.loadURL('http://localhost:5173');
		} catch (error) {
			// console.log('error:', error);
		} finally {
			// mainWindow.loadURL('http://localhost:5173/settings');
			mainWindow.loadURL('http://localhost:5173/set-up');
		}
	})();
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
