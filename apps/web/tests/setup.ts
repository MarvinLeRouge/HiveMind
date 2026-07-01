import { config } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import en from '../src/i18n/locales/en.json';
import fr from '../src/i18n/locales/fr.json';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en, fr },
});

config.global.plugins = [...(config.global.plugins ?? []), i18n];
