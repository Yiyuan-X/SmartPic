
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '🌏 SmartPicture | AI Multilingual SEO Demo',
  description: 'SmartPicture auto-generated static export for i18n testing.',
  openGraph: {
    title: 'SmartPicture AI SEO',
    description: 'Multilingual Next.js static site with i18n + AEO + SEO',
    url: 'https://smartpicture.ai',
    siteName: 'SmartPicture',
    images: ['/og.png'],
    locale: 'zh_CN',
    type: 'website',
  },
};

export default function Page() {
  return (
    <main style={{ padding: '3rem', lineHeight: '1.6' }}>
      <h1>🌏 SmartPicture 多语言 SEO 测试页</h1>
      <p>此页面由脚本自动生成，支持多语言与静态导出。</p>
      <p><strong>Next.js 14 + output: 'export'</strong> 已启用。</p>
      <p>✅ SEO + AEO 元标签自动生成。</p>
    </main>
  );
}
