const { app, BrowserWindow, Menu, globalShortcut } = require('electron');
const path = require('path');
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join(__dirname, 'assets', getPlatformIcon()),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
            // preload: path.join(__dirname, 'preload.js') // Uncomment if you use a preload script
        }
    });

    // Remove the default menu
    Menu.setApplicationMenu(null);

    // Corrected references to 'mainWindow' instead of 'win'
    mainWindow.loadFile('home.html');
    mainWindow.webContents.openDevTools();

    // Setup a global shortcut to refresh the window
    globalShortcut.register('CommandOrControl+R', () => {
        mainWindow.reload();
    });
}

function getPlatformIcon() {
    // Simplified to always return 'codepoint.png', regardless of platform
    return 'codepoint.png';
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
