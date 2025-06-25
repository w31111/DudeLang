
import React from 'react';
import { Language } from '../types';
import { IconClose } from '../constants';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLanguage: (language: Language) => void;
  currentLanguage: Language;
  availableLanguages: Language[];
  title: string;
}

const LanguageModal: React.FC<LanguageModalProps> = ({
  isOpen,
  onClose,
  onSelectLanguage,
  currentLanguage,
  availableLanguages,
  title
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out">
      <div className="bg-neutral-900 rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        <header className="flex justify-between items-center p-4 border-b border-neutral-700">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
            aria-label="Close language selection"
          >
            <IconClose className="w-6 h-6" />
          </button>
        </header>
        
        <nav className="overflow-y-auto p-4 flex-grow">
          <ul className="space-y-2">
            {availableLanguages.map((lang) => (
              <li key={lang.code}>
                <button
                  onClick={() => onSelectLanguage(lang)}
                  className={`w-full text-left px-4 py-3 rounded-md transition-colors text-lg
                    ${currentLanguage.code === lang.code 
                      ? 'bg-blue-600 text-white font-medium' 
                      : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'}`}
                >
                  {lang.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default LanguageModal;
