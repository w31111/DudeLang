import React, { useState, useEffect, useCallback } from 'react';
import { Language, SavedTranslation } from '../types';
import { 
  IconSpinner, IconCopy, IconCheck, IconSpeakerPlay, IconSpeakerStop, 
  IconSave, IconSaveFilled, LOCALSTORAGE_SAVED_KEY, IconInfo, IconChevronDown
  // IconSparkles was only used for the removed "Pro Insights" header
} from '../constants';
import { getSlangExplanation, getExampleSentences } from '../services/geminiService';

interface TextAreaOutputProps {
  inputText: string; 
  text: string; 
  explanation: string;
  isLoading: boolean;
  error: string | null;
  sourceLanguage: Language; 
  targetLanguage: Language;
  isSubscribed: boolean;
}

const TextAreaOutput: React.FC<TextAreaOutputProps> = ({
  inputText,
  text,
  explanation,
  isLoading,
  error,
  sourceLanguage,
  targetLanguage,
  isSubscribed,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [showExamples, setShowExamples] = useState(false);
  const [exampleSentences, setExampleSentences] = useState<string[]>([]);
  const [isExamplesLoading, setIsExamplesLoading] = useState(false);
  const [examplesError, setExamplesError] = useState<string | null>(null);

  const hasProFeatures = isSubscribed;

  const resetProFeatures = () => {
    setShowExamples(false);
    setExampleSentences([]);
    setExamplesError(null);
  };

  useEffect(() => {
    resetProFeatures();
  }, [inputText, sourceLanguage, targetLanguage]);

  useEffect(() => {
    const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    setSpeechSynthesisSupported(supported);
  }, []);

  useEffect(() => {
    if (!inputText.trim() || !text.trim()) {
      setIsSaved(false);
      return;
    }
    try {
      const existingItemsJSON = localStorage.getItem(LOCALSTORAGE_SAVED_KEY);
      const existingItems: SavedTranslation[] = existingItemsJSON ? JSON.parse(existingItemsJSON) : [];
      const currentlyDisplayedTranslationIsSaved = existingItems.some(
        item =>
          item.inputText === inputText &&
          item.outputText === text &&
          item.sourceLanguage.code === sourceLanguage.code &&
          item.targetLanguage.code === targetLanguage.code
      );
      setIsSaved(currentlyDisplayedTranslationIsSaved);
    } catch (e) {
      console.error("Failed to check saved status:", e);
      setIsSaved(false); 
    }
  }, [inputText, text, sourceLanguage, targetLanguage]);

  const handleCopy = useCallback(async () => {
    if (!text || typeof navigator.clipboard?.writeText !== 'function') return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, [text]);

  const handleSpeak = useCallback(() => {
    if (!text || !speechSynthesisSupported) return;

    // Stop any currently playing speech before starting a new one
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLanguage.code;
    
    // We no longer need to manage the isSpeaking state for this simple implementation.
    // The browser handles the queue.
    
    window.speechSynthesis.speak(utterance);
  }, [text, speechSynthesisSupported, targetLanguage.code]);
  
  useEffect(() => {
    // This effect is no longer necessary as we are not using the isSpeaking state.
    // return () => {
    //   if (isSpeaking) {
    //     window.speechSynthesis.cancel();
    //   }
    // };
  }, [isSpeaking]);

  const handleSave = useCallback(() => {
    if (!inputText.trim() || !text.trim()) return;

    try {
      const existingItemsJSON = localStorage.getItem(LOCALSTORAGE_SAVED_KEY);
      let existingItems: SavedTranslation[] = existingItemsJSON ? JSON.parse(existingItemsJSON) : [];

      const currentTranslationIndex = existingItems.findIndex(
        item =>
          item.inputText === inputText &&
          item.outputText === text &&
          item.sourceLanguage.code === sourceLanguage.code &&
          item.targetLanguage.code === targetLanguage.code
      );

      if (currentTranslationIndex > -1) { 
        existingItems.splice(currentTranslationIndex, 1);
        localStorage.setItem(LOCALSTORAGE_SAVED_KEY, JSON.stringify(existingItems));
        setIsSaved(false);
      } else { 
        const newSavedItem: SavedTranslation = {
          id: Date.now().toString(),
          inputText,
          outputText: text,
          sourceLanguage,
          targetLanguage,
          timestamp: Date.now(),
        };
        existingItems.unshift(newSavedItem); 
        localStorage.setItem(LOCALSTORAGE_SAVED_KEY, JSON.stringify(existingItems));
        setIsSaved(true);
      }
    } catch (e) {
      console.error("Failed to toggle save state:", e);
    }
  }, [inputText, text, sourceLanguage, targetLanguage]);

  const handleShowExamples = async () => {
    if (showExamples) {
      setShowExamples(false);
      return;
    }
    if (!inputText.trim() || !text.trim()) return;
    try {
      setIsExamplesLoading(true);
      const sentencesText = await getExampleSentences(text, targetLanguage);
      const sentencesArray = sentencesText.split('\\n').filter(s => s.trim() !== '');
      setExampleSentences(sentencesArray);
      setShowExamples(true);
    } catch (e) {
      setExamplesError(e instanceof Error ? e.message : "Failed to fetch examples.");
      setExampleSentences([]);
      setShowExamples(false);
    } finally {
      setIsExamplesLoading(false);
    }
  };

  const canInteract = !isLoading && !error && !!text.trim();

  return (
    <div className="bg-neutral-900 border border-neutral-700 text-gray-100 text-lg rounded-xl p-4 w-full min-h-[10rem] sm:min-h-[12rem] flex flex-col">
      {/* Text Content Area */}
      <div className="relative w-full flex-grow">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 bg-opacity-75 z-30">
            <IconSpinner className="w-8 h-8" />
          </div>
        )}
        
        {error && !isLoading && (
          <div className="text-red-400 w-full">
            <p className="font-semibold">Error:</p>
            <p className="whitespace-pre-wrap break-words">{error}</p>
          </div>
        )}
        {!isLoading && !error && text && (
          <p className="whitespace-pre-wrap break-words w-full">{text}</p> 
        )}
        {!isLoading && !error && !text && (
          <p className="text-neutral-500">Translation will appear here...</p>
        )}
      </div>

      {/* Bottom Controls Area */}
      <div>
        {/* Action Buttons Bar */}
        <div className="w-full pt-2 mt-2 flex items-center space-x-2 z-20">
          {canInteract && (
            <>
              {speechSynthesisSupported && (
                <button
                  onClick={handleSpeak}
                  className="p-2 text-neutral-400 hover:text-white transition-colors"
                  aria-label="Speak text"
                  title="Speak text"
                >
                  <IconSpeakerPlay className="w-5 h-5" />
                </button>
              )}
               <button
                onClick={handleSave}
                className="p-2 text-neutral-400 hover:text-white transition-colors"
                aria-label={isSaved ? "Unsave translation" : "Save translation"}
                title={isSaved ? "Unsave translation" : "Save translation"}
              >
                {isSaved ? <IconSaveFilled className="w-5 h-5 text-blue-400" /> : <IconSave className="w-5 h-5" />}
              </button>
              <button
                onClick={handleCopy}
                className="p-2 text-neutral-400 hover:text-white disabled:text-neutral-600 disabled:cursor-not-allowed transition-colors"
                aria-label="Copy text"
                title="Copy text"
              >
                {copied ? <IconCheck className="w-5 h-5 text-green-400" /> : <IconCopy className="w-5 h-5" />}
              </button>
            </>
          )}
        </div>

        {/* Pro Features Section */}
        {text && !isLoading && !error && explanation && hasProFeatures && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="mt-2">
              <p className="text-sm text-gray-400 whitespace-pre-wrap">{explanation}</p>
            </div>
            <div className="mb-4"></div>
            <div className="flex flex-col space-y-2">
              <button
                onClick={handleShowExamples}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors text-left flex items-center"
              >
                <IconChevronDown className={`w-4 h-4 mr-2 transition-transform ${showExamples ? 'rotate-180' : ''}`} />
                {showExamples ? 'Hide Examples' : 'Show Examples'}
              </button>
              {isExamplesLoading && <IconSpinner className="w-5 h-5" />}
              {examplesError && <p className="text-xs text-red-400">{examplesError}</p>}
              {showExamples && !isExamplesLoading && !examplesError && (
                <div id="example-sentences-content" className="mt-2 p-3 bg-neutral-800 rounded-md text-sm text-neutral-300 space-y-2">
                  {exampleSentences.map((sentence, index) => (
                    <p key={index} className="whitespace-pre-wrap break-words">{sentence}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextAreaOutput;