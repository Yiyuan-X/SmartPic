#!/usr/bin/env tsx
/**
 * 🌐 SmartPicture Auto i18n Export Full Fix
 * 自动修复 Next.js 14 + App Router + i18n 静态导出 404 问题
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const log = (msg: string) => console.log("👉 " + msg);

// === 1️⃣ 统一 next.config.mjs ===
const nextConfig = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  reactStrictMode: true,
  experimental: { optimizeCss: true },
  async redirects() {
    return [
      { source: '/', destination: '/zh', permanent: false }
    ]
  }
}
export default nextConfig
`;
fs.writeFileSync("next.config.mjs", nextConfig);
log("✅ next.config.mjs 已修复");

// === 2️⃣ 写入 src/i18n.ts ===
fs.mkdirSync("src", { recursive: true });
const i18nContent = `export const locales = ['zh', 'en', 'ja', 'ko', 'fr', 'de'];
export const defaultLocale = 'zh';`;
fs.writeFileSync("src/i18n.ts", i18nContent);
log("✅ src/i18n.ts 已生成");

// === 3️⃣ 修复 app/[locale]/layout.tsx ===
const layoutPath = path.join("src/app/[locale]/layout.tsx");
if (fs.existsSync(layoutPath)) {
  let layoutContent = fs.readFileSync(layoutPath, "utf8");
  if (!layoutContent.includes("generateStaticParams")) {
    const prepend = `
import { locales } from '../i18n';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

`;
    layoutContent = prepend + layoutContent;
    fs.writeFileSync(layoutPath, layoutContent);
    log("✅ 已注入 generateStaticParams() 到 app/[locale]/layout.tsx");
  } else {
    log("ℹ️ layout.tsx 已包含 generateStaticParams()，跳过注入");
  }
} else {
  log("⚠️ 未找到 src/app/[locale]/layout.tsx，请检查目录结构");
}

// === 4️⃣ 清理并重新构建 ===
log("🧹 清理旧构建 ...");
execSync("rm -rf .next out", { stdio: "inherit" });

log("🏗️ 重新构建静态网站 ...");
execSync("pnpm build", { stdio: "inherit" });

log("🎉 修复完成！请运行 `pnpm start` 并访问 http://localhost:3000/zh/");
