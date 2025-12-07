import { locales } from '../../i18n'


export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata = {
  title: 'SmartPicture – AI Tech News & SEO',
  description: 'Multilingual AI-powered static website with auto SEO & AEO optimization.'
};

export default function LocaleLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
