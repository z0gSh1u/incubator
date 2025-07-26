import { app, BrowserWindow } from 'electron';
import { createWindow as createElecBrowWindowInternal } from '../main/main';

/**
 * Configuration options for the ElecBrow browser window
 */
export interface ElecBrowOptions {
  /**
   * Window width in pixels
   * @default 1200
   */
  width?: number;

  /**
   * Window height in pixels
   * @default 800
   */
  height?: number;

  /**
   * Initial URL to load when the browser opens
   * @default 'about:blank'
   */
  startUrl?: string;

  /**
   * Whether to show developer tools on start
   * @default false
   */
  showDevTools?: boolean;

  /**
   * User agent string to use for browser requests
   * If not specified, will use Chrome's user agent
   */
  userAgent?: string;
}

// New function to configure remote debugging
export function configureRemoteDebugging(options?: { enableRemoteDebugging?: boolean; remoteDebuggingPort?: number }) {
  if (options?.enableRemoteDebugging) {
    app.commandLine.appendSwitch('remote-debugging-port', options.remoteDebuggingPort?.toString() || '9222');
  }
}

/**
 * Creates and configures an ElecBrow browser window
 *
 * @param options Configuration options
 * @returns The created BrowserWindow instance
 */
export function createElecBrowWindow(options?: ElecBrowOptions): BrowserWindow {
  // Create the browser window using the internal function
  const window = createElecBrowWindowInternal({
    width: options?.width,
    height: options?.height,
    showDevTools: options?.showDevTools,
    userAgent: options?.userAgent,
  });

  // If a startUrl is provided and it's not about:blank, trigger navigation
  if (options?.startUrl && options.startUrl !== 'about:blank') {
    window.webContents.once('did-finish-load', () => {
      // Send a message to the renderer to create a tab with the startUrl
      window.webContents.send('new-tab-created', { url: options.startUrl });
    });
  }

  return window;
}
