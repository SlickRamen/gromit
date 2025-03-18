const { app, BrowserWindow } = require('electron');
const path = require('path');
require('ejs-electron'); // Automatically enables EJS rendering in Electron

let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // Correct way to load an EJS file in Electron
  mainWindow.loadFile(path.join(__dirname, 'views', 'pages', 'index.ejs'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
