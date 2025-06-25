import React, { useState, useEffect, useCallback } from 'react';
import { Language, SavedTranslation } from './types';
import { 
  APP_TITLE, SUPPORTED_LANGUAGES, DEFAULT_SOURCE_LANG, DEFAULT_TARGET_LANG, 
  IconSwap, IconChevronDown, IconHome, IconBookmark, IconSparkles, // Changed IconCrown to IconSparkles
  LOCALSTORAGE_SUBSCRIPTION_KEY, getHeaderTitle
} from './constants';
import LanguageButton from './components/LanguageButton';
import LanguageModal from './components/LanguageModal';
import TextAreaInput from './components/TextAreaInput';
import TextAreaOutput from './components/TextAreaOutput';
import SavedTranslationsView from './components/SavedTranslationsView';
import SettingsView from './components/SettingsView';
import SuccessView from './components/SuccessView'; // SuccessViewをインポート
import { translateText } from './services/geminiService';
import { v4 as uuidv4 } from 'uuid'; // Import uuid

type View = 'home' | 'saved' | 'settings' | 'success'; // 'success'を追加

const App: React.FC = () => {
  const [sourceLanguage, setSourceLanguage] = useState<Language>(DEFAULT_SOURCE_LANG);
  const [targetLanguage, setTargetLanguage] = useState<Language>(DEFAULT_TARGET_LANG);
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isSourceModalOpen, setIsSourceModalOpen] = useState<boolean>(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<View>('home');
  const [debouncedInputText, setDebouncedInputText] = useState<string>(inputText);

  // Anonymous ID State
  const [anonymousId, setAnonymousId] = useState<string>(() => {
    let storedId = localStorage.getItem('anonymousId');
    if (!storedId) {
      storedId = uuidv4();
      localStorage.setItem('anonymousId', storedId);
    }
    return storedId;
  });

  // Subscription State (Initial value will be fetched from backend)
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);

  // Fetch subscription status from backend on mount or anonymousId change
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (anonymousId) {
        try {
          const response = await fetch(`http://localhost:3000/api/get-subscription-status?anonymous_id=${anonymousId}`);
          const data = await response.json();
          if (data.isSubscribed !== undefined) {
            setIsSubscribed(data.isSubscribed);
          } else {
            console.error('Failed to get subscription status from backend:', data.error);
            setIsSubscribed(false);
          }
        } catch (err) {
          console.error('Error fetching subscription status:', err);
          setIsSubscribed(false);
        }
      }
    };
    fetchSubscriptionStatus();
  }, [anonymousId]);


  // 購読成功時のハンドラー - この関数はSuccessViewから呼ばれる。ここでは、サーバーサイドでの状態保存は完了している前提。
  const handleSubscriptionSuccess = useCallback(() => {
    // サーバーから最新の状態を取得し直す
    const fetchSubscriptionStatus = async () => {
      if (anonymousId) {
        try {
          const response = await fetch(`http://localhost:3000/api/get-subscription-status?anonymous_id=${anonymousId}`);
          const data = await response.json();
          if (data.isSubscribed !== undefined) {
            setIsSubscribed(data.isSubscribed);
          } else {
            console.error('Failed to get subscription status from backend after success:', data.error);
          }
        } catch (err) {
          console.error('Error fetching subscription status after success:', err);
        }
      }
    };
    fetchSubscriptionStatus();
    // 購読成功後、ホーム画面に戻る
    setCurrentView('home');
    // URLからsession_idとanonymous_idを削除
    window.history.replaceState({}, document.title, window.location.pathname);
  }, [anonymousId]);


  const handleToggleSubscription = () => {
    // この関数は、サブスクリプションがサーバーサイドで管理されるようになったため、意味がありません。
    // UIからのトグル機能を削除するか、別の目的（例えば、Stripeポータルへのリンク）に変更する必要があります。
    // 仮に何もしないでおく。
    console.warn("Subscription toggle is now managed server-side. This function has no effect.");
  };

  useEffect(() => {
    // URLに基づいて初期ビューを設定
    const urlParams = new URLSearchParams(window.location.search);
    const path = window.location.pathname;
    if (path === '/success') {
      // SuccessViewのonSubscriptionSuccessで匿名IDを渡せるようにする
      const sessionId = urlParams.get('session_id');
      const receivedAnonymousId = urlParams.get('anonymous_id');
      if (sessionId && receivedAnonymousId && receivedAnonymousId === anonymousId) {
        // ここで直接SuccessViewにanonymousIdを渡すのではなく、
        // SuccessViewがBackendを呼ぶ際にanonymousIdも渡すように変更する
        // App.tsxのhandleSubscriptionSuccessが呼ばれるようにSuccessViewを設定
        setCurrentView('success');
      } else {
        // 不正なアクセスやIDの不一致の場合はホームへ
        setCurrentView('home');
        window.history.replaceState({}, document.title, '/');
      }
    } else {
      setCurrentView('home'); // デフォルトはホーム
    }
  }, [anonymousId]); // anonymousIdが確定してから実行

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedInputText(inputText);
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [inputText]);

  const handleTranslation = useCallback(async () => {
    if (!debouncedInputText.trim()) {
      setOutputText('');
      setExplanation('');
      setError(null);
      setIsLoading(false);
      return;
    }

    if (sourceLanguage.code === targetLanguage.code && sourceLanguage.code !== 'auto') {
        setOutputText(debouncedInputText); 
        setExplanation('');
        setError(null);
        setIsLoading(false);
        return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const result = await translateText(debouncedInputText, sourceLanguage, targetLanguage);
      setOutputText(result.translation);
      if (isSubscribed) {
        setExplanation(result.explanation);
      } else {
        setExplanation(''); // Clear explanation for free users
      }
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred during translation.');
      }
      setOutputText('');
      setExplanation('');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedInputText, sourceLanguage, targetLanguage, isSubscribed]);

  useEffect(() => {
    if (currentView === 'home') {
        handleTranslation();
    }
  }, [debouncedInputText, sourceLanguage, targetLanguage, handleTranslation, currentView]);

  const handleSwapLanguages = () => {
    if (sourceLanguage.code === 'auto' || targetLanguage.code === 'auto') {
        const oldSource = sourceLanguage;
        const oldTarget = targetLanguage;
        if (oldSource.code === 'auto') {
             setSourceLanguage(oldTarget.code === 'auto' ? DEFAULT_SOURCE_LANG : oldTarget);
             setTargetLanguage(oldSource); 
        } else { 
            setSourceLanguage(targetLanguage.code === 'auto' ? DEFAULT_TARGET_LANG : targetLanguage); 
            setTargetLanguage(sourceLanguage);
        }
    } else { 
        setSourceLanguage(targetLanguage);
        setTargetLanguage(sourceLanguage);
    }
    
    setInputText(outputText); 
    // Pro features will be cleared by useEffect in TextAreaOutput due to outputText dependency (implicitly via inputText)
  };

  const handleSelectSourceLang = (lang: Language) => {
    setSourceLanguage(lang);
    setIsSourceModalOpen(false);
  };

  const handleSelectTargetLang = (lang: Language) => {
    setTargetLanguage(lang);
    setIsTargetModalOpen(false);
  };

  const handleLoadTranslation = (item: SavedTranslation) => {
    setInputText(item.inputText);
    setOutputText(item.outputText); 
    setSourceLanguage(item.sourceLanguage);
    setTargetLanguage(item.targetLanguage);
    setCurrentView('home');
  };

  const headerTitle = getHeaderTitle(currentView, APP_TITLE);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 font-sans">
      <header className="py-6 px-4">
        <h1 
          className="text-3xl font-bold text-center text-white cursor-pointer"
          onClick={handleReload}
          title="Reload Page"
        >
            {headerTitle}
        </h1>
      </header>

      <main className="flex-grow flex flex-col px-4 pb-24 overflow-y-auto">
        {currentView === 'home' && (
          <>
            <div className="flex justify-between items-center mb-4 space-x-2">
              <LanguageButton language={sourceLanguage} onClick={() => setIsSourceModalOpen(true)} className="flex-1"/>
              <button
                onClick={handleSwapLanguages}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                aria-label="Swap languages"
              >
                <IconSwap className="w-6 h-6" />
              </button>
              <LanguageButton language={targetLanguage} onClick={() => setIsTargetModalOpen(true)} className="flex-1"/>
            </div>

            <TextAreaInput
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type here..."
            />

            <div className="flex justify-center items-center my-3 text-neutral-500">
              <IconChevronDown className="w-8 h-8" />
            </div>

            <TextAreaOutput
              inputText={inputText}
              text={outputText}
              explanation={explanation}
              isLoading={isLoading}
              error={error}
              sourceLanguage={sourceLanguage}
              targetLanguage={targetLanguage}
              isSubscribed={isSubscribed}
            />
            
            {!isSubscribed && ( // Conditionally render ad space
              <div className="text-center py-2 mt-3">
                <p className="text-xs text-neutral-500 italic">
                  ↓Sorry—just dropping some ad space here real quick↓
                </p>
              </div>
            )}
          </>
        )}
        {currentView === 'saved' && (
          <SavedTranslationsView 
            onLoadTranslation={handleLoadTranslation}
          />
        )}
        {currentView === 'settings' && ( // New Settings View
          <SettingsView 
            isSubscribed={isSubscribed}
            onToggleSubscription={handleToggleSubscription}
            anonymousId={anonymousId} // anonymousIdを渡す
          />
        )}
        {currentView === 'success' && ( // New Success View
          <SuccessView onSubscriptionSuccess={handleSubscriptionSuccess} />
        )}
      </main>

      {currentView !== 'success' && ( // SuccessViewが表示されているときはナビゲーションを非表示にする
        <nav className="fixed bottom-0 left-0 right-0 flex justify-around items-center bg-neutral-950 p-3 border-t border-neutral-800 shadow-md">
          <button 
              onClick={() => setCurrentView('home')}
              className={`p-2 ${currentView === 'home' ? 'text-white' : 'text-neutral-400'} hover:text-white transition-colors flex flex-col items-center`} 
              aria-label="Home"
              aria-current={currentView === 'home' ? 'page' : undefined}
          >
            <IconHome className="w-7 h-7" />
          </button>
          <button 
              onClick={() => setCurrentView('saved')}
              className={`p-2 ${currentView === 'saved' ? 'text-white' : 'text-neutral-400'} hover:text-white transition-colors flex flex-col items-center`} 
              aria-label="Saved"
              aria-current={currentView === 'saved' ? 'page' : undefined}
          >
            <IconBookmark className="w-7 h-7" />
          </button>
          <button
              onClick={() => setCurrentView('settings')}
              className={`p-2 ${currentView === 'settings' ? 'text-white' : 'text-neutral-400'} hover:text-white transition-colors flex flex-col items-center`} 
              aria-label="Subscription Settings"
              aria-current={currentView === 'settings' ? 'page' : undefined}
          >
            <IconSparkles className="w-7 h-7" />
          </button>
        </nav>
      )}

      {isSourceModalOpen && (
        <LanguageModal
          isOpen={isSourceModalOpen}
          onClose={() => setIsSourceModalOpen(false)}
          onSelectLanguage={handleSelectSourceLang}
          currentLanguage={sourceLanguage}
          availableLanguages={SUPPORTED_LANGUAGES}
          title="Translate From"
        />
      )}
      {isTargetModalOpen && (
        <LanguageModal
          isOpen={isTargetModalOpen}
          onClose={() => setIsTargetModalOpen(false)}
          onSelectLanguage={handleSelectTargetLang}
          currentLanguage={targetLanguage}
          availableLanguages={SUPPORTED_LANGUAGES.filter(lang => lang.code !== 'auto')}
          title="Translate To"
        />
      )}
    </div>
  );
};

export default App;
