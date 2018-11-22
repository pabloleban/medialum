function isElectron(){
	return window && window.process && window.process.type;
}

var Electron = {};

if(isElectron()){
	Electron.electron = require('electron')
	Electron.electron.browserWindow = Electron.electron.remote.BrowserWindow
	Electron.ipcRenderer = Electron.electron.ipcRenderer;
	Electron.path = require('path')
	Electron.emojisURL = Electron.ipcRenderer.sendSync("emojis-url")

	const TitlebarWindows = require("electron-titlebar-windows")
	const titlebar = new TitlebarWindows({draggable:true,backgroundColor:"#00305d"});
	titlebar.appendTo(document.body);
	
	$(".titlebar-close").click(function(){window.close()});
	
	$(".titlebar-resize").click(function(){electronCall("resize")})
	$(".titlebar").dblclick(function(){	electronCall("resize")})

	$(".titlebar-minimize").click(function(){electronCall("minimize")});
}

function electronCall(message){
	if(!isElectron()) return;
	
	if(Electron !== null && Electron.ipcRenderer===null){
		console.error("ipcRender is null");
	} else {
		Electron.ipcRenderer.send(message)
	}
}