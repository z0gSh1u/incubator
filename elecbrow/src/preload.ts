import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Tab management
  createTab: (id: string, url: string) => ipcRenderer.invoke('create-tab', { id, url }),
  switchTab: (id: string) => ipcRenderer.invoke('switch-tab', { id }),
  closeTab: (id: string) => ipcRenderer.invoke('close-tab', { id }),
  hideAllBrowserViews: () => ipcRenderer.invoke('hide-all-browser-views'),

  // Navigation
  navigateToUrl: (id: string, url: string) => ipcRenderer.invoke('navigate-to-url', { id, url }),
  goBack: (id: string) => ipcRenderer.invoke('go-back', { id }),
  goForward: (id: string) => ipcRenderer.invoke('go-forward', { id }),
  reload: (id: string) => ipcRenderer.invoke('reload', { id }),

  // Event listeners
  onNewTabCreated: (callback: (data: { url: string }) => void) => {
    ipcRenderer.on('new-tab-created', (_event, data) => callback(data));
    // Return a function to remove the listener
    return () => {
      ipcRenderer.removeAllListeners('new-tab-created');
    };
  },

  onTabTitleUpdated: (callback: (data: { id: string; title: string }) => void) => {
    ipcRenderer.on('tab-title-updated', (_event, data) => callback(data));
    return () => {
      ipcRenderer.removeAllListeners('tab-title-updated');
    };
  },

  onTabLoading: (callback: (data: { id: string; isLoading: boolean }) => void) => {
    ipcRenderer.on('tab-loading', (_event, data) => callback(data));
    return () => {
      ipcRenderer.removeAllListeners('tab-loading');
    };
  },

  onTabUrlUpdated: (callback: (data: { id: string; url: string }) => void) => {
    ipcRenderer.on('tab-url-updated', (_event, data) => callback(data));
    return () => {
      ipcRenderer.removeAllListeners('tab-url-updated');
    };
  },

  onBrowserViewsHidden: (callback: () => void) => {
    ipcRenderer.on('browser-views-hidden', (_event) => callback());
    return () => {
      ipcRenderer.removeAllListeners('browser-views-hidden');
    };
  },
});
