
export interface Language {
  code: string;
  name: string;
}

export interface SavedTranslation {
  id: string;
  inputText: string;
  outputText: string;
  sourceLanguage: Language;
  targetLanguage: Language;
  timestamp: number;
}
