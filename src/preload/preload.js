const { contextBridge, ipcRenderer } = require('electron');
// https://stackoverflow.com/a/65242779
// https://stackoverflow.com/a/52126346
// https://www.electronjs.org/docs/latest/tutorial/process-model
contextBridge.exposeInMainWorld('api', {
	send: (channel, data) => ipcRenderer.invoke(channel, data),
	handle: (channel, callable, event, data) => ipcRenderer.on(channel, callable(event, data)),
});
