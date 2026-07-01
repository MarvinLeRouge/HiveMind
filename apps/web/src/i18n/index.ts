import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import fr from './locales/fr.json';

export type Locale = 'en' | 'fr';

export const SUPPORTED_LOCALES: Locale[] = ['en', 'fr'];

/**
 * Configured vue-i18n instance.
 * Locale is set to 'en' by default; update via `i18n.global.locale.value`
 * after the user's preferred language is loaded from the API.
 */
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en, fr },
});

export default i18n;
