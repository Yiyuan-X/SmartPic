// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  // 1) Fallback（防止构建时 locale === undefined）
  const safeLocale = locale ?? 'en'; // ← 改成你的默认语言，zh 也可以

  return {
    locale: safeLocale,
    messages: (await import(`../../messages/${safeLocale}.json`)).default
  };
});
