// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Aye Maties — premium interactive ocean experience
export default defineConfig({
  site: 'https://ayematies.info',
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de', 'es', 'fr'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', de: 'de', es: 'es', fr: 'fr' },
      },
    }),
  ],
  build: { assets: '_assets' },
});
