import en from '../dictionaries/en.json';
import zh from '../dictionaries/zh.json';
import es from '../dictionaries/es.json';
import ja from '../dictionaries/ja.json';
import de from '../dictionaries/de.json';
import fr from '../dictionaries/fr.json';

export type Language = 'en' | 'zh' | 'es' | 'ja' | 'de' | 'fr';

export const dictionaries = {
  en,
  zh,
  es,
  ja,
  de,
  fr,
};

export const languageNames: Record<Language, string> = {
  en: 'English',
  zh: '简体中文',
  es: 'Español',
  ja: '日本語',
  de: 'Deutsch',
  fr: 'Français',
};

export function getDictionary(lang: Language) {
  return dictionaries[lang] || dictionaries.en;
}