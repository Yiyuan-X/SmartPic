import { getRequestConfig } from 'next-intl/server';
export default getRequestConfig(() => ({
  locales: ['en','zh','ja','ko','fr','de','es','pt'],
  defaultLocale: 'en'
}));
