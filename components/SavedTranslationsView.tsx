
import React, { useState, useEffect, useCallback } from 'react';
import { SavedTranslation } from '../types';
import { LOCALSTORAGE_SAVED_KEY, IconTrash, IconLoadTranslation } from '../constants';

interface SavedTranslationsViewProps {
  onLoadTranslation: (item: SavedTranslation) => void;
}

const SavedTranslationsView: React.FC<SavedTranslationsViewProps> = ({ onLoadTranslation }) => {
  const [savedItems, setSavedItems] = useState<SavedTranslation[]>([]);

  const loadItemsFromStorage = useCallback(() => {
    try {
      const itemsJSON = localStorage.getItem(LOCALSTORAGE_SAVED_KEY);
      if (itemsJSON) {
        setSavedItems(JSON.parse(itemsJSON));
      } else {
        setSavedItems([]);
      }
    } catch (e) {
      console.error("Failed to load saved translations:", e);
      setSavedItems([]);
    }
  }, []);

  useEffect(() => {
    loadItemsFromStorage();
    // Add event listener for storage changes from other tabs/windows
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LOCALSTORAGE_SAVED_KEY) {
        loadItemsFromStorage();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadItemsFromStorage]);

  const handleDeleteItem = (id: string) => {
    const updatedItems = savedItems.filter(item => item.id !== id);
    localStorage.setItem(LOCALSTORAGE_SAVED_KEY, JSON.stringify(updatedItems));
    setSavedItems(updatedItems);
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to delete all saved translations?")) {
      localStorage.removeItem(LOCALSTORAGE_SAVED_KEY);
      setSavedItems([]);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const d = new Date(timestamp);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`; // E.g., "06/06 21:02"
  };

  if (savedItems.length === 0) {
    return (
      <div className="text-center text-neutral-400 py-10">
        <p className="text-xl">No saved translations yet.</p>
        <p className="mt-2">Start translating and save your favorites!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {savedItems.length > 0 && (
          <div className="flex justify-end mb-4">
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg text-sm transition-colors shadow-md"
              aria-label="Clear all saved translations"
            >
              Clear All
            </button>
          </div>
      )}
      {savedItems.map((item) => (
        <div key={item.id} className="bg-neutral-800 p-4 rounded-xl shadow-lg">
          {/* Header */}
          <div className="flex justify-between items-center mb-3">
            <p className="text-base font-medium text-white">
              {item.sourceLanguage.name === 'Auto Detect' ? 'Auto' : item.sourceLanguage.name} → {item.targetLanguage.name}
            </p>
            <p className="text-sm text-neutral-400">{formatTimestamp(item.timestamp)}</p>
          </div>

          {/* Content and Actions Flex Container */}
          <div className="flex justify-between items-end">
            <div className="flex-grow pr-3"> {/* pr-3 to give space for actions */}
              <p className="text-xl text-white mb-1 whitespace-pre-wrap break-words">
                {item.inputText}
              </p>
              <p className="text-xl text-white font-medium whitespace-pre-wrap break-words">
                {item.outputText}
              </p>
            </div>
            
            <div className="flex items-center self-end">
              <button
                onClick={() => onLoadTranslation(item)}
                className="p-1.5 text-neutral-400 hover:text-blue-300 transition-colors mr-1 opacity-75 hover:opacity-100"
                aria-label="Load this translation"
                title="Load translation"
              >
                <IconLoadTranslation className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteItem(item.id)}
                className="p-1.5 text-neutral-400 hover:text-red-300 transition-colors opacity-75 hover:opacity-100"
                aria-label="Delete this translation"
                title="Delete translation"
              >
                <IconTrash className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SavedTranslationsView;
