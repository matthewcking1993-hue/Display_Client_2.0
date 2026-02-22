const { app, BrowserWindow, ipcMain, session, nativeTheme, screen, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const AutoLaunch = require('auto-launch');
const Store = require('electron-store');

const envPath = resolveEnvPath();
if (envPath) {
  require('dotenv').config({ path: envPath });
}

const store = new Store({ name: 'kds-device-shell' });
const autoLauncher = new AutoLaunch({ name: 'KDS Device Shell' });

let mainWindow;
let watchdogTimer;

const DISPLAY_URL = process.env.VITE_DISPLAY_URL || process.env.KDS_DISPLAY_URL || 'https://example.com';

function resolveEnvPath() {
  const possible = [path.join(process.cwd(), '.env'), path.join(process.resourcesPath || '', '.env')];
  return possible.find((candidate) => fs.existsSync(candidate));
}

const createWindow = () => {
  nativeTheme.themeSource = 'dark';

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    fullscreen: true,
    kiosk: true,
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
      devTools: process.env.NODE_ENV === 'development'
    }
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.on('closed', () => (mainWindow = undefined));
  mainWindow.on('unresponsive', () => restartRenderer('Renderer unresponsive'));
  mainWindow.webContents.on('render-process-gone', (_, details) => restartRenderer('Renderer gone', details));
  mainWindow.webContents.on('context-menu', (event) => event.preventDefault());

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (process.env.NODE_ENV === 'development' && devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  enforceHeaders();
  wireWatchdog();
};

const enforceHeaders = () => {
  try {
    const targetHost = new URL(DISPLAY_URL).host;
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
      if (details.url.includes(targetHost)) {
        const deviceId = store.get('deviceId');
        if (deviceId) {
          details.requestHeaders['X-KDS-Device-ID'] = deviceId;
        }
      }
      callback({ requestHeaders: details.requestHeaders });
    });
  } catch (error) {
    console.error('Failed to enforce headers', error);
  }
};

const wireWatchdog = () => {
  watchdogTimer = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      app.relaunch();
      app.exit(0);
    }
  }, 20000);
};

const restartRenderer = (reason, details) => {
  console.warn('Restarting renderer', reason, details);
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.reload();
};

app.whenReady().then(() => {
  createWindow();
  autoLauncher
    .isEnabled()
    .then((enabled) => {
      if (!enabled) return autoLauncher.enable();
      return undefined;
    })
    .catch(() => undefined);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('storage:readDeviceId', () => store.get('deviceId') ?? null);
ipcMain.handle('storage:writeDeviceId', (_, deviceId) => store.set('deviceId', deviceId));

ipcMain.handle('storage:readStation', () => store.get('station') ?? null);
ipcMain.handle('storage:writeStation', (_, station) =>
  station ? store.set('station', station) : store.delete('station')
);

ipcMain.handle('device:getMetadata', () => {
  const primary = screen.getPrimaryDisplay();
  return {
    platform: os.platform(),
    osVersion: os.release(),
    model: os.hostname(),
    manufacturer: 'Microsoft',
    isVirtual: false,
    screen: {
      width: primary.size.width,
      height: primary.size.height,
      density: primary.scaleFactor,
      orientation: primary.size.width >= primary.size.height ? 'landscape' : 'portrait',
      touchSupport: primary.touchSupport !== 'unknown' && primary.touchSupport !== 'off'
    },
    appVersion: app.getVersion()
  };
});

ipcMain.handle('device:autostart', (_, enabled) => (enabled ? autoLauncher.enable() : autoLauncher.disable()));
ipcMain.handle('watchdog:reload', () => mainWindow?.reload());

ipcMain.handle('logging:export', async (_, payload, fileName) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: fileName,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (canceled || !filePath) return;
  fs.writeFileSync(filePath, payload, 'utf8');
});
*** End File