import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}) => ({
  locales: ['zh', 'zh-TW', 'en', 'ja', 'ko', 'fr', 'de', 'es'],
  defaultLocale: 'zh',
  messages: (await import(`../locales/${locale}.json`)).default
}));
