import {NextIntlClientProvider} from 'next-intl';
import {notFound} from 'next/navigation';
import React, {ReactNode} from 'react';
import '../../globals.css';

// ✅ 静态生成多语言目录
export function generateStaticParams() {
  return ['en', 'zh-TW', 'ja', 'ko', 'fr', 'de', 'es', 'pt'].map((locale) => ({
    locale,
  }));
}

export const metadata = {
  title: 'SmartPicture AI',
  description: 'AI-powered multilingual SEO and automation platform',
};

interface LocaleLayoutProps {
  children: ReactNode;
  params: {locale: string};
}

export default async function LocaleLayout({
  children,
  params: {locale},
}: LocaleLayoutProps) {
  let messages;
  try {
    messages = (await import(`../../locales/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
