#!/usr/bin/env tsx
/**
 * 🌍 SmartPicture Auto i18n Export + SEO Fix
 * 一键修复 Next.js 14 App Router + next-intl 静态导出问题
 * 功能：
 *   ✅ 自动修复 next.config.mjs
 *   ✅ 自动创建 src/i18n.ts
 *   ✅ 自动创建 app/[locale]/page.tsx + layout.tsx
 *   ✅ 自动生成多语言 SEO 元信息
 *   ✅ 自动构建 /out/zh /out/en 静态网站
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const log = (msg: string) => console.log("👉 " + msg);

// === 1️⃣ 修复 next.config.mjs ===
const nextConfig = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  reactStrictMode: true,
  experimental: { optimizeCss: true },
  async redirects() {
    return [{ source: '/', destination: '/zh', permanent: false }]
  }
}
export default nextConfig
`;
fs.writeFileSync("next.config.mjs", nextConfig);
log("✅ next.config.mjs 已更新");

// === 2️⃣ 创建 src/i18n.ts ===
fs.mkdirSync("src", { recursive: true });
const i18nContent = `export const locales = ['zh', 'en'];
export const defaultLocale = 'zh';`;
fs.writeFileSync("src/i18n.ts", i18nContent);
log("✅ src/i18n.ts 已生成");

// === 3️⃣ 创建 app/[locale]/layout.tsx ===
const appDir = path.join("src", "app", "[locale]");
fs.mkdirSync(appDir, { recursive: true });
const layoutContent = `
import { locales } from '../i18n';

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
`;
fs.writeFileSync(path.join(appDir, "layout.tsx"), layoutContent);
log("✅ app/[locale]/layout.tsx 已修复");

// === 4️⃣ 创建 app/[locale]/page.tsx ===
const pageContent = `
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
`;
fs.writeFileSync(path.join(appDir, "page.tsx"), pageContent);
log("✅ app/[locale]/page.tsx 已创建");

// === 5️⃣ 清理旧构建并重新构建 ===
log("🧹 清理旧文件 (.next, out)...");
execSync("rm -rf .next out", { stdio: "inherit" });

log("🏗️ 正在构建静态网站...");
execSync("pnpm build", { stdio: "inherit" });

log("🎉 一键修复完成！运行以下命令启动本地预览：\n\n👉 pnpm start\n\n然后访问: http://localhost:3000/zh/");
