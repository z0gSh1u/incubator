import { app, BrowserWindow } from 'electron';
import { createElecBrowWindow, ElecBrowOptions, configureRemoteDebugging } from './lib/browser';

// Re-export types and functions for consumers
export { ElecBrowOptions } from './lib/browser';
export { configureRemoteDebugging } from './lib/browser';

/**
 * Creates and opens an ElecBrow multi-tab browser window
 *
 * @param options Configuration options for the browser window
 * @returns The created BrowserWindow instance
 */
export function createBrowser(options?: ElecBrowOptions): BrowserWindow {
  // Ensure the app is ready before creating a window
  if (!app.isReady()) {
    throw new Error('Electron app must be ready before creating a browser window');
  }

  return createElecBrowWindow(options);
}

/**
 * Launches a standalone ElecBrow browser
 * This is used when the package is run directly (not imported)
 */
export function launch(): void {
  app.whenReady().then(() => {
    createBrowser();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createBrowser();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

// Auto-launch ONLY if this file is directly executed (not when required/imported)
if (require.main && require.main.filename === __filename) {
  launch();
}
