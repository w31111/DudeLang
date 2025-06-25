
import React from 'react';
import { Language } from '../types';

interface LanguageButtonProps {
  language: Language;
  onClick: () => void;
  className?: string;
}

const LanguageButton: React.FC<LanguageButtonProps> = ({ language, onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={`bg-neutral-800 text-gray-200 px-4 py-3 rounded-lg text-base sm:text-lg font-medium hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors truncate ${className}`}
    >
      {language.name}
    </button>
  );
};

export default LanguageButton;
