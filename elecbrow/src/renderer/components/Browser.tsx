import React from 'react';
import { Tab } from './App';
import '../styles/Browser.css';
import NewTabPage from './NewTabPage';
import '../styles/NewTabPage.css';

interface BrowserProps {
  tab: Tab;
  navigateTo: (url: string) => void;
}

const Browser: React.FC<BrowserProps> = ({ tab, navigateTo }) => {
  return (
    <div className="browser-container">
      {tab.url === 'about:blank' ? (
        <div className="new-tab-container">
          <NewTabPage navigateTo={navigateTo} />
        </div>
      ) : (
        // This is just a placeholder - actual content is rendered by BrowserView in the main process
        <div className="content-view" id={`browser-view-container-${tab.id}`}></div>
      )}
    </div>
  );
};

export default Browser;
