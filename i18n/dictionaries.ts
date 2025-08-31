import { defaultLocale, SupportedLanguage } from "./config";

const dictionaries = {
  en: () => import("./locales/en.json").then((module) => module.default),
  es: () => import("./locales/es.json").then((module) => module.default),
} as const; // Add 'as const' for better type inference

// Create a type for the dictionary keys
type DictionaryKey = keyof typeof dictionaries;

export const getDictionary = async (locale: SupportedLanguage) => {
  // Type assertion to ensure TypeScript knows locale is a valid key
  const key = locale as DictionaryKey;
  return dictionaries[key]?.() || dictionaries[defaultLocale as DictionaryKey]();
};