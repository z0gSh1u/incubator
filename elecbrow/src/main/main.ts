import { app, BrowserWindow, ipcMain, session, WebContentsView, Menu, BrowserView } from 'electron';
import * as path from 'path';

// We still need BrowserView for now as WebContentsView doesn't directly work with add/removeBrowserView
const browserViews: Map<string, BrowserView> = new Map();
const webContentsMap: Map<string, Electron.WebContents> = new Map();
let activeViewId: string | null = null;
let mainWindow: BrowserWindow | null = null;

// Export the createWindow function so it can be called from the library
export function createWindow(options?: {
  width?: number;
  height?: number;
  showDevTools?: boolean;
  userAgent?: string;
}): BrowserWindow {
  const width = options?.width || 1200;
  const height = options?.height || 800;
  const showDevTools = options?.showDevTools || false;
  const userAgent = options?.userAgent;

  mainWindow = new BrowserWindow({
    width,
    height,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    autoHideMenuBar: true,
    frame: true,
  });

  // Hide the default menu bar completely
  Menu.setApplicationMenu(null);

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  if (showDevTools) {
    mainWindow.webContents.openDevTools();
  }

  // Set user agent if provided
  if (userAgent) {
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
      details.requestHeaders['User-Agent'] = userAgent;
      callback({ requestHeaders: details.requestHeaders });
    });
  } else {
    // Default to Chrome's user agent
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
      const chromeUA =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36';
      details.requestHeaders['User-Agent'] = chromeUA;
      callback({ requestHeaders: details.requestHeaders });
    });
  }

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media', 'geolocation', 'notifications', 'fullscreen'];
    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      callback(false);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    browserViews.clear();
    webContentsMap.clear();
  });

  mainWindow.on('resize', () => {
    resizeActiveView();
  });

  return mainWindow;
}

function resizeActiveView() {
  if (!mainWindow || !activeViewId) return;

  const activeView = browserViews.get(activeViewId);
  if (!activeView) return;

  const bounds = mainWindow.getBounds();
  activeView.setBounds({
    x: 0,
    y: 90,
    width: bounds.width,
    height: bounds.height - 90,
  });
}

// Only initialize these event handlers if this is being run directly
if (require.main === module) {
  app.whenReady().then(() => {
    createWindow();

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
}

// Set up IPC handlers
function setupIpcHandlers() {
  ipcMain.handle('create-tab', async (_event, { id, url = 'about:blank' }) => {
    if (!mainWindow) return false;

    try {
      // Create a BrowserView for showing web content
      const browserView = new BrowserView({
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: true,
          allowRunningInsecureContent: false,
          javascript: true,
        },
      });

      const contents = browserView.webContents;

      // Store references
      browserViews.set(id, browserView);
      webContentsMap.set(id, contents);

      // Handle new window requests
      contents.setWindowOpenHandler(({ url }) => {
        if (mainWindow) {
          mainWindow.webContents.send('new-tab-created', { url });
        }
        return { action: 'deny' };
      });

      // Track page title changes
      contents.on('page-title-updated', (_event, title) => {
        if (mainWindow) {
          mainWindow.webContents.send('tab-title-updated', { id, title });
        }
      });

      // Track navigation state
      contents.on('did-start-loading', () => {
        if (mainWindow) {
          mainWindow.webContents.send('tab-loading', { id, isLoading: true });
        }
      });

      contents.on('did-stop-loading', () => {
        if (mainWindow) {
          mainWindow.webContents.send('tab-loading', { id, isLoading: false });
          mainWindow.webContents.send('tab-url-updated', {
            id,
            url: contents.getURL(),
          });
        }
      });

      // For about:blank, we don't need to load anything - the tab will show the NewTabPage component
      if (url !== 'about:blank') {
        // Load URL
        await contents.loadURL(url);
      }

      return true;
    } catch (error) {
      console.error('Error creating tab:', error);
      return false;
    }
  });

  ipcMain.handle('switch-tab', (_event, { id }) => {
    if (!mainWindow) return false;

    const view = browserViews.get(id);
    if (!view) return false;

    // Remove current active view
    if (activeViewId) {
      const currentView = browserViews.get(activeViewId);
      if (currentView) {
        mainWindow.removeBrowserView(currentView);
      }
    }

    // Set and show the new view
    mainWindow.addBrowserView(view);
    activeViewId = id;
    resizeActiveView();

    return true;
  });

  ipcMain.handle('close-tab', (_event, { id }) => {
    if (!mainWindow) return false;

    const view = browserViews.get(id);
    if (!view) return false;

    // If this is the active view, remove it from the window
    if (activeViewId === id && mainWindow) {
      mainWindow.removeBrowserView(view);
      activeViewId = null;
    }

    // Close the associated webContents
    const contents = webContentsMap.get(id);
    if (contents && !contents.isDestroyed()) {
      contents.close();
    }

    // Clean up references
    browserViews.delete(id);
    webContentsMap.delete(id);

    return true;
  });

  ipcMain.handle('navigate-to-url', async (_event, { id, url }) => {
    if (!mainWindow) return false;

    const contents = webContentsMap.get(id);
    if (!contents || contents.isDestroyed()) return false;

    try {
      await contents.loadURL(url);
      return true;
    } catch (error) {
      console.error('Error navigating to URL:', error);
      return false;
    }
  });

  ipcMain.handle('go-back', (_event, { id }) => {
    if (!mainWindow) return false;

    const contents = webContentsMap.get(id);
    if (!contents || contents.isDestroyed() || !contents.canGoBack()) return false;

    contents.goBack();
    return true;
  });

  ipcMain.handle('go-forward', (_event, { id }) => {
    if (!mainWindow) return false;

    const contents = webContentsMap.get(id);
    if (!contents || contents.isDestroyed() || !contents.canGoForward()) return false;

    contents.goForward();
    return true;
  });

  ipcMain.handle('reload', (_event, { id }) => {
    if (!mainWindow) return false;

    const contents = webContentsMap.get(id);
    if (!contents || contents.isDestroyed()) return false;

    contents.reload();
    return true;
  });

  ipcMain.handle('hide-all-browser-views', (_event) => {
    if (!mainWindow) return false;

    // Remove current active view
    if (activeViewId) {
      const currentView = browserViews.get(activeViewId);
      if (currentView) {
        mainWindow.removeBrowserView(currentView);
      }
      activeViewId = null;
    }

    // Notify the renderer that browser views have been hidden
    if (mainWindow) {
      mainWindow.webContents.send('browser-views-hidden');
    }

    return true;
  });
}

// Set up IPC handlers when app is ready
app.whenReady().then(() => {
  setupIpcHandlers();
});
