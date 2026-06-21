// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Aye Maties — premium interactive ocean experience
export default defineConfig({
  // To switch to the custom domain later: set site:'https://ayematies.info',
  // remove `base`, and add public/CNAME — that's the one-line change.
  site: 'https://piaxoxo.github.io',
  base: '/Aye-maties',
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
