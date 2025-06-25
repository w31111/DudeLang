import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_MODEL_TEXT } from '../constants';
import { Language } from "../types";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
console.log("GEMINI_API_KEY (first 5 chars):", GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 5) : "Not set"); // Debugging
const MODEL_NAME = GEMINI_MODEL_TEXT;

let model: any = null;

if (GEMINI_API_KEY) {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: MODEL_NAME });
    console.log("GoogleGenerativeAI client initialized:", !!model); // Debugging
    // 利用可能なモデル一覧を取得して出力（不要なので削除）
    // const models = await genAI.getModels();
    // console.log("Available models:", models);
  } catch (error: any) {
    console.error("Failed to initialize GoogleGenerativeAI:", error);
  }
} else {
  console.warn("Gemini API key is not set. Translation functionality will be disabled.");
}

const callGemini = async (prompt: string): Promise<string> => {
  if (!model) {
    throw new Error("Gemini API client is not initialized. Please ensure VITE_GEMINI_API_KEY is configured correctly.");
  }
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const resultText = response.text();
    if (typeof resultText !== 'string') {
      console.error("Gemini API response.text is not a string:", result);
      throw new Error("Received an invalid response format from the service.");
    }
    return resultText.trim();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && error.message.includes("API key not valid")) {
      throw new Error("The provided API key is not valid. Please check your configuration.");
    } else if (error instanceof Error) {
      throw new Error(`Service error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while contacting the service.");
  }
};

export async function translateText(
  inputText: string, 
  sourceLang: Language, 
  targetLang: Language
): Promise<{ translation: string; explanation: string }> {
  if (!inputText.trim()) {
    return { translation: "", explanation: "" };
  }
  if (sourceLang.code === targetLang.code) {
    return { translation: inputText, explanation: "" };
  }

  const prompt = `
You are an expert linguist and translator specializing in modern, casual internet slang.
Your goal is to translate text while preserving its original nuance, keeping the translation as short, concise, and natural as possible.

Translate the following text from ${sourceLang.name} to ${targetLang.name}.

Input Text:
"""
${inputText}
"""

Your response must contain two parts, separated by a line containing only "---":
1.  **Translation**: On the first line, provide only the single, most fitting and natural-sounding slang translation. It should be brief and something you'd see in a casual text conversation. Do not provide multiple options.
2.  **Explanation**: After the "---" separator, provide a brief explanation of the slang and nuance in the translated text. **This explanation must be written in ${sourceLang.name}**.

Example for "まじ卍" from Japanese to English:
This is wild
---
「This is wild」は、何かが「ヤバい」「すごい」「ありえない」と感じた時に使われる英語の一般的な表現で、「まじ卍」が持つカオスで強調的なエネルギーを捉えています。

Now, process the input text.
`;
  
  const rawResult = await callGemini(prompt);
  const parts = rawResult.split('---');
  
  if (parts.length >= 2) {
    return {
      translation: parts[0].trim(),
      explanation: parts[1].trim()
    };
  } else {
    // If the model doesn't follow the format, return the whole text as translation
    return {
      translation: rawResult,
      explanation: "Could not automatically separate translation and explanation."
    };
  }
}

export async function getSlangExplanation(
  slangText: string,
  language: Language
): Promise<string> {
  if (!slangText.trim()) {
    return "No text provided for explanation.";
  }
  const prompt = `Explain the slang terms and colloquialisms used in the following ${language.name} text: "${slangText}".\nProvide a clear and concise explanation for each.\nIf no specific slang is detected, state that the text is fairly standard for informal ${language.name} or already quite casual.\nOutput only the explanation. Do not include any introductory phrases or text other than the explanation itself.`;
  return callGemini(prompt);
}

export async function getExampleSentences(
  slangText: string,
  language: Language
): Promise<string> {
  if (!slangText.trim()) {
    return "No text provided for examples.";
  }
  const prompt = `Provide 2-3 example sentences in ${language.name} that naturally use the phrase or a key part of: "${slangText}".
The sentences should showcase common usage in everyday conversation and be distinct from the input phrase.
If the input text is very short or generic, and it's difficult to provide meaningful examples, state that.
Output only the example sentences, each on a new line. Do not include any introductory phrases or text other than the examples.`;
  return callGemini(prompt);
}
