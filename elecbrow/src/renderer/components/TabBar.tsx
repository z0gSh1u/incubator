import React, { useState, useRef } from 'react';
import { FiPlus, FiX } from 'react-icons/fi';
import { Tab } from './App';
import '../styles/TabBar.css';

interface TabBarProps {
  tabs: Tab[];
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  onAddTab: () => void;
  onReorderTabs?: (sourceId: string, targetId: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, onTabClick, onTabClose, onAddTab, onReorderTabs }) => {
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);
  const tabRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Store a reference to a tab element
  const setTabRef = (el: HTMLDivElement | null, id: string) => {
    tabRefs.current[id] = el;
  };

  // Start dragging
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggedTabId(id);
    // Set data for native HTML5 drag and drop
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';

    // Set ghost image (clone of the tab)
    if (tabRefs.current[id]) {
      const rect = tabRefs.current[id]!.getBoundingClientRect();
      const ghostElem = tabRefs.current[id]!.cloneNode(true) as HTMLDivElement;

      // Apply styles to the ghost element
      ghostElem.style.position = 'absolute';
      ghostElem.style.top = '-1000px';
      ghostElem.style.opacity = '0.8';
      ghostElem.style.width = `${rect.width}px`;
      ghostElem.style.height = `${rect.height}px`;

      document.body.appendChild(ghostElem);
      e.dataTransfer.setDragImage(ghostElem, rect.width / 2, rect.height / 2);

      // Clean up ghost element after drag starts
      setTimeout(() => {
        document.body.removeChild(ghostElem);
      }, 0);
    }
  };

  // Handle drag over another tab
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    if (draggedTabId !== id) {
      setDragOverTabId(id);
    }
  };

  // Handle drop on another tab
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedTabId && draggedTabId !== id && onReorderTabs) {
      onReorderTabs(draggedTabId, id);
    }

    // Clear states
    setDraggedTabId(null);
    setDragOverTabId(null);
  };

  // Handle drag end (cleanup)
  const handleDragEnd = () => {
    setDraggedTabId(null);
    setDragOverTabId(null);
  };

  // Get tab class names based on state
  const getTabClassNames = (tab: Tab) => {
    let classNames = `tab ${tab.isActive ? 'active' : ''}`;

    if (tab.id === draggedTabId) {
      classNames += ' dragging';
    }

    if (tab.id === dragOverTabId) {
      const draggedIndex = tabs.findIndex((t) => t.id === draggedTabId);
      const currentIndex = tabs.findIndex((t) => t.id === tab.id);

      if (draggedIndex !== -1 && currentIndex !== -1) {
        classNames += draggedIndex < currentIndex ? ' drag-right' : ' drag-left';
      }
    }

    return classNames;
  };

  return (
    <div className="tab-bar">
      <div className="tabs">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            ref={(el) => setTabRef(el, tab.id)}
            className={getTabClassNames(tab)}
            onClick={() => onTabClick(tab.id)}
            draggable="true"
            onDragStart={(e) => handleDragStart(e, tab.id)}
            onDragOver={(e) => handleDragOver(e, tab.id)}
            onDragLeave={() => dragOverTabId === tab.id && setDragOverTabId(null)}
            onDrop={(e) => handleDrop(e, tab.id)}
            onDragEnd={handleDragEnd}
          >
            <div className="tab-title" title={tab.url}>
              {tab.title || 'Loading...'}
            </div>
            <button
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
            >
              <FiX />
            </button>
          </div>
        ))}
      </div>
      <button className="new-tab-button" onClick={onAddTab}>
        <FiPlus />
      </button>
    </div>
  );
};

export default TabBar;
