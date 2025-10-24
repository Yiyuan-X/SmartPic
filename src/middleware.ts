// middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'zh-TW', 'ja', 'ko', 'fr', 'de', 'es', 'pt'],
  defaultLocale: 'en',
  localeDetection: true
});

export const config = {
  matcher: ['/', '/(en|zh-TW|ja|ko|fr|de|es|pt)/:path*']
};
