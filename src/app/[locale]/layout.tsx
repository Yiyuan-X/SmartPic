import {NextIntlClientProvider} from "next-intl";
import {locales} from "@/lib/i18n.config";
import {baseSiteMetadata, buildAlternates} from "@/lib/seo";
import type {Metadata} from "next";

export async function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

export function generateMetadata({params}:{params:{locale:string}}): Metadata {
  return {
    ...baseSiteMetadata(),
    title: "SmartPicture – AI Visual Hub",
    description: "AI-generated multi-language content with auto SEO",
    ...buildAlternates(params.locale)
  };
}

export default function RootLayout({children, params}:{children:React.ReactNode; params:{locale:string}}) {
  return (
    <html lang={params.locale}>
      <body>
        <NextIntlClientProvider locale={params.locale}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
