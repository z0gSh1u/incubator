const { app } = require('electron');
// const { createBrowser } = require('elecbrow');
const { createBrowser, configureRemoteDebugging } = require('../dist');

// Configure remote debugging before creating the browser window if needed
configureRemoteDebugging({ enableRemoteDebugging: true, remoteDebuggingPort: 9222 });

app.whenReady().then(() => {
  // Create a browser window
  const browser = createBrowser({
    width: 1200,
    height: 800,
    startUrl: 'https://github.com',
    showDevTools: false,
  });

  console.log('Browser window created!');

  // Handle window close
  browser.on('closed', () => {
    console.log('Browser window closed');
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
