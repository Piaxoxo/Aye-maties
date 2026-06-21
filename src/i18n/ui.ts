// ---- i18n architecture (scalable, 4 languages) ----
import { en } from './en';
import { de } from './de';
import { es } from './es';
import { fr } from './fr';

export const languages = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
} as const;

export const defaultLang = 'en';
export type Lang = keyof typeof languages;
export const locales = Object.keys(languages) as Lang[];

const dictionaries: Record<Lang, Record<string, string>> = { en, de, es, fr };

/** Resolve the active language from a URL pathname (/de/... -> 'de'). */
export function getLangFromUrl(url: URL): Lang {
  const seg = url.pathname.split('/')[1];
  return (seg in languages ? seg : defaultLang) as Lang;
}

/** Translator: falls back to English, then the key itself. */
export function useT(lang: Lang) {
  const dict = dictionaries[lang] ?? en;
  return (key: string): string => dict[key] ?? en[key] ?? key;
}

/** Prefix a path with the locale (default locale stays unprefixed). */
export function localize(path: string, lang: Lang): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (lang === defaultLang) return clean;
  return clean === '/' ? `/${lang}` : `/${lang}${clean}`;
}

/** Same logical path in every language — for hreflang alternates. */
export function alternates(path: string) {
  return locales.map((l) => ({ lang: l, href: localize(path, l) }));
}
