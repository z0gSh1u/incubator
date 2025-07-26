import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiArrowRight, FiRefreshCw, FiX } from 'react-icons/fi';
import '../styles/AddressBar.css';

interface AddressBarProps {
  url: string;
  isLoading?: boolean;
  onNavigate: (url: string) => void;
  onBack?: () => void;
  onForward?: () => void;
  onReload?: () => void;
}

const AddressBar: React.FC<AddressBarProps> = ({ url, isLoading = false, onNavigate, onBack, onForward, onReload }) => {
  const [inputValue, setInputValue] = useState(url);

  // Update input value when url prop changes
  useEffect(() => {
    setInputValue(url);
  }, [url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onNavigate(inputValue);
    }
  };

  return (
    <div className="address-bar">
      <div className="navigation-buttons">
        <button className="nav-button" title="Back" onClick={onBack}>
          <FiArrowLeft />
        </button>
        <button className="nav-button" title="Forward" onClick={onForward}>
          <FiArrowRight />
        </button>
        <button className="nav-button" title={isLoading ? 'Stop' : 'Reload'} onClick={onReload}>
          {isLoading ? <FiX /> : <FiRefreshCw />}
        </button>
      </div>

      <form className="url-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="url-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter URL or search term"
        />
      </form>
    </div>
  );
};

export default AddressBar;
