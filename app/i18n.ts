// app/i18n.ts
import {getRequestConfig} from 'next-intl/server';

const supportedLocales = ['en', 'zh-TW', 'ja', 'ko', 'fr', 'de', 'es', 'pt'];

export default getRequestConfig(async ({locale}) => {
  if (!supportedLocales.includes(locale)) locale = 'en';
  const messages = (await import(`../locales/${locale}.json`)).default;
  return {messages};
});
