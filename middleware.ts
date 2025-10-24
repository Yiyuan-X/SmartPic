import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['zh', 'zh-TW', 'en', 'ja', 'ko', 'fr', 'de', 'es'],
  defaultLocale: 'zh',
});

export const config = {
  // 让中间件在所有非静态请求生效（排除 API/_next）
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
