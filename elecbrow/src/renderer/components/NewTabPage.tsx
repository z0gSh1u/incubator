import React from 'react';
import '../styles/NewTabPage.css';

interface NewTabPageProps {
  navigateTo: (url: string) => void;
}

const NewTabPage: React.FC<NewTabPageProps> = ({ navigateTo }) => {
  return (
    <div className="new-tab-page">
      <div className="new-tab-content">
        <h1>New Tab</h1>
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search or enter website name"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const value = e.currentTarget.value;
                if (value) {
                  const url = value.includes('://') ? value : `https://${value}`;
                  navigateTo(url);
                  e.currentTarget.value = '';
                }
              }
            }}
            autoFocus
          />
        </div>
      </div>
    </div>
  );
};

export default NewTabPage;
