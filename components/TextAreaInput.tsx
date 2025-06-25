
import React from 'react';

interface TextAreaInputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
}

const TextAreaInput: React.FC<TextAreaInputProps> = ({ value, onChange, placeholder }) => {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="bg-neutral-900 border border-neutral-700 text-gray-100 text-lg rounded-xl p-4 w-full h-40 sm:h-48 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder-neutral-500 transition-colors"
      aria-label="Input text for translation"
    />
  );
};

export default TextAreaInput;
