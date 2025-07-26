import React, { useState, useEffect, useRef } from 'react';
import Browser from './Browser';
import TabBar from './TabBar';
import AddressBar from './AddressBar';
import '../styles/App.css';

export interface Tab {
  id: string;
  url: string;
  title: string;
  isActive: boolean;
  isLoading?: boolean;
}

const App: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const initialTabCreated = useRef(false);

  // Initialize with a single tab on mount
  useEffect(() => {
    if (!initialTabCreated.current && tabs.length === 0) {
      initialTabCreated.current = true;
      createTab('about:blank');
    }
  }, [tabs]);

  // Set up event listeners for browser views
  useEffect(() => {
    // Listen for new tab requests
    const newTabCleanup = window.electronAPI.onNewTabCreated((data) => {
      createTab(data.url);
    });

    // Listen for title updates
    const titleCleanup = window.electronAPI.onTabTitleUpdated((data) => {
      updateTabTitle(data.id, data.title);
    });

    // Listen for loading state changes
    const loadingCleanup = window.electronAPI.onTabLoading((data) => {
      setTabLoading(data.id, data.isLoading);
    });

    // Listen for URL updates
    const urlCleanup = window.electronAPI.onTabUrlUpdated((data) => {
      updateTabUrl(data.id, data.url);
    });

    // Listen for browser views hidden event
    const hiddenCleanup = window.electronAPI.onBrowserViewsHidden(() => {
      // Force a re-render when browser views are hidden
      setTabs((prevTabs) => [...prevTabs]);
    });

    return () => {
      newTabCleanup();
      titleCleanup();
      loadingCleanup();
      urlCleanup();
      hiddenCleanup();
    };
  }, []);

  // Update the CSS style for browser views
  useEffect(() => {
    // Add a CSS class to the app element when the active tab is a new tab page
    const appElement = document.querySelector('.app');
    if (appElement) {
      const activeTab = tabs.find((tab) => tab.isActive);
      if (activeTab?.url === 'about:blank') {
        appElement.classList.add('new-tab-active');
      } else {
        appElement.classList.remove('new-tab-active');
      }
    }
  }, [tabs]);

  // Create a new tab
  const createTab = async (url: string = 'about:blank') => {
    const id = Date.now().toString();
    const newTab: Tab = {
      id,
      url,
      title: 'New Tab',
      isActive: true,
      isLoading: url !== 'about:blank',
    };

    // First update local state
    setTabs((prevTabs) => prevTabs.map((tab) => ({ ...tab, isActive: false })).concat(newTab));

    // For about:blank, just hide any active browser views
    if (url === 'about:blank') {
      await window.electronAPI.hideAllBrowserViews();
    } else {
      // For real URLs, create browser view in main process
      const success = await window.electronAPI.createTab(id, url);
      if (!success) {
        console.error('Failed to create browser view');
      } else {
        // Switch to this tab
        await window.electronAPI.switchTab(id);
      }
    }
  };

  // Close a tab
  const closeTab = async (id: string) => {
    const tabIndex = tabs.findIndex((tab) => tab.id === id);

    if (tabs.length <= 1) {
      // If it's the last tab, create a new one
      createTab('about:blank');

      // Close the browser view in main process
      await window.electronAPI.closeTab(id);

      // Remove from state
      setTabs((prevTabs) => prevTabs.filter((tab) => tab.id !== id));
      return;
    }

    const newTabs = tabs.filter((tab) => tab.id !== id);

    // If we're closing the active tab, activate the next one or the previous one
    if (tabs[tabIndex].isActive) {
      const newActiveIndex = tabIndex === tabs.length - 1 ? tabIndex - 1 : tabIndex;
      const newActiveId = newTabs[newActiveIndex].id;

      // Activate this tab in local state
      newTabs[newActiveIndex].isActive = true;

      // If the new active tab is about:blank, hide all browser views
      if (newTabs[newActiveIndex].url === 'about:blank') {
        await window.electronAPI.hideAllBrowserViews();
      } else {
        // Otherwise, activate in main process
        await window.electronAPI.switchTab(newActiveId);
      }
    }

    // Close the browser view in main process
    await window.electronAPI.closeTab(id);

    // Update local state
    setTabs(newTabs);
  };

  // Switch to a specific tab
  const switchTab = async (id: string) => {
    const tab = tabs.find((tab) => tab.id === id);
    if (!tab) return;

    setTabs((prevTabs) =>
      prevTabs.map((tab) => ({
        ...tab,
        isActive: tab.id === id,
      }))
    );

    // If switching to about:blank, hide all browser views
    if (tab.url === 'about:blank') {
      await window.electronAPI.hideAllBrowserViews();
    } else {
      // Otherwise, switch to the appropriate browser view
      await window.electronAPI.switchTab(id);
    }
  };

  // Navigate to a URL in the current tab
  const navigateTo = async (url: string) => {
    // Add http:// if not present and not about:blank
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('about:')) {
      url = 'https://' + url;
    }

    const activeTab = tabs.find((tab) => tab.isActive);
    if (!activeTab) return;

    // For about:blank tabs, we need to create a browser view first
    if (activeTab.url === 'about:blank') {
      // Set loading state
      setTabs((prevTabs) =>
        prevTabs.map((tab) => {
          if (tab.isActive) {
            return { ...tab, url, title: url, isLoading: true };
          }
          return tab;
        })
      );

      // Create browser view
      const success = await window.electronAPI.createTab(activeTab.id, url);
      if (!success) {
        console.error('Failed to create browser view');

        // Reset loading state
        setTabs((prevTabs) =>
          prevTabs.map((tab) => {
            if (tab.isActive) {
              return { ...tab, isLoading: false };
            }
            return tab;
          })
        );
        return;
      }

      // Switch to the new browser view
      await window.electronAPI.switchTab(activeTab.id);
    } else {
      // For existing tabs, just navigate to the URL
      setTabs((prevTabs) =>
        prevTabs.map((tab) => {
          if (tab.isActive) {
            return { ...tab, url, isLoading: true };
          }
          return tab;
        })
      );

      // Navigate in main process
      await window.electronAPI.navigateToUrl(activeTab.id, url);
    }
  };

  // Update tab title
  const updateTabTitle = (id: string, title: string) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) => {
        if (tab.id === id) {
          return { ...tab, title };
        }
        return tab;
      })
    );
  };

  // Update tab URL
  const updateTabUrl = (id: string, url: string) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) => {
        if (tab.id === id) {
          return { ...tab, url };
        }
        return tab;
      })
    );
  };

  // Set tab loading state
  const setTabLoading = (id: string, isLoading: boolean) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) => {
        if (tab.id === id) {
          return { ...tab, isLoading };
        }
        return tab;
      })
    );
  };

  // Reorder tabs by dragging
  const reorderTabs = (sourceId: string, targetId: string) => {
    const sourceIndex = tabs.findIndex((tab) => tab.id === sourceId);
    const targetIndex = tabs.findIndex((tab) => tab.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    // Create a new array with the tabs reordered
    const newTabs = [...tabs];
    const [draggedTab] = newTabs.splice(sourceIndex, 1);
    newTabs.splice(targetIndex, 0, draggedTab);

    setTabs(newTabs);
  };

  // Go back in browser history
  const goBack = async () => {
    const activeTab = tabs.find((tab) => tab.isActive);
    if (!activeTab || activeTab.url === 'about:blank') return;

    await window.electronAPI.goBack(activeTab.id);
  };

  // Go forward in browser history
  const goForward = async () => {
    const activeTab = tabs.find((tab) => tab.isActive);
    if (!activeTab || activeTab.url === 'about:blank') return;

    await window.electronAPI.goForward(activeTab.id);
  };

  // Reload current page
  const reload = async () => {
    const activeTab = tabs.find((tab) => tab.isActive);
    if (!activeTab || activeTab.url === 'about:blank') return;

    await window.electronAPI.reload(activeTab.id);
  };

  const activeTab = tabs.find((tab) => tab.isActive) || tabs[0];

  // Don't render anything if we don't have any tabs yet
  if (!activeTab) {
    return null;
  }

  return (
    <div className="app">
      <div className="browser-controls">
        <TabBar
          tabs={tabs}
          onTabClick={switchTab}
          onTabClose={closeTab}
          onAddTab={() => createTab()}
          onReorderTabs={reorderTabs}
        />
        <AddressBar
          url={tabs.find((tab) => tab.isActive)?.url || ''}
          isLoading={tabs.find((tab) => tab.isActive)?.isLoading || false}
          onNavigate={navigateTo}
          onBack={goBack}
          onForward={goForward}
          onReload={reload}
        />
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`browser-view ${tab.isActive ? 'active' : ''}`}
          style={{ display: tab.isActive ? 'block' : 'none' }}
        >
          <Browser tab={tab} navigateTo={navigateTo} />
        </div>
      ))}
    </div>
  );
};

export default App;
