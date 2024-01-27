"use strict";
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("api", {
  send: (channel, data) => ipcRenderer.invoke(channel, data),
  handle: (channel, callable, event, data) => ipcRenderer.on(channel, callable(event, data))
  // openFileSystem: () => {
  // 	// window.api.openFileSystem(
  // 	console.log('test');
  // 	dialog.showOpenDialog({ properties: ['openFile'] }).then(function (response) {
  // 		if (!response.canceled) {
  // 			// handle fully qualified file name
  // 			console.log(response.filePaths[0]);
  // 		} else {
  // 			console.log('no file selected');
  // 		}
  // 	});
  // },
});
