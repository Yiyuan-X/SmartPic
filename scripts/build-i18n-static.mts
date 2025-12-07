/**
 * 🌍 SmartPicture i18n Exporter v3
 * ✅ 不依赖 Next.js 自身的 next export
 * ✅ 自动从 .next/server/app/ 拷贝出 HTML 页面
 * ✅ 自动复制成多语言版本
 * ✅ 自动生成 Firebase rewrites
 */

import fs from "fs";
import path from "path";

const BUILD_DIR = path.resolve(".next/server/app");
const OUT_DIR = path.resolve("out");
const FIREBASE_JSON = path.resolve("firebase.json");

// 支持的语言
const LOCALES = ["en", "zh-TW", "ja", "ko", "fr", "de", "es", "pt"];
const DEFAULT_LANG = "zh-TW";

// 确保 .next/server/app 存在
if (!fs.existsSync(BUILD_DIR)) {
  console.error("❌ 请先运行 `pnpm run build`。未找到 .next/server/app/");
  process.exit(1);
}

// 确保 out 目录存在
fs.mkdirSync(OUT_DIR, { recursive: true });

// 找到 main HTML 文件
const possibleFiles = [
  path.join(BUILD_DIR, "page.html"),
  path.join(BUILD_DIR, "index.html"),
  path.join(BUILD_DIR, "default.html"),
];

let baseHtml = "";
for (const file of possibleFiles) {
  if (fs.existsSync(file)) {
    baseHtml = fs.readFileSync(file, "utf-8");
    console.log(`✅ 找到构建页面：${file}`);
    break;
  }
}

if (!baseHtml) {
  console.error("❌ 未找到 Next.js 构建的 HTML 页面 (.next/server/app 内)。");
  process.exit(1);
}

// 复制多语言版本
for (const locale of LOCALES) {
  const dir = path.join(OUT_DIR, locale);
  fs.mkdirSync(dir, { recursive: true });
  const localizedHtml = baseHtml.replace(
    /<html[^>]*lang="[^"]*"[^>]*>/,
    `<html lang="${locale}">`
  );
  fs.writeFileSync(path.join(dir, "index.html"), localizedHtml);
  console.log(`🌐 生成: /out/${locale}/index.html`);
}

// 复制 404 页面
const NOT_FOUND_SRC = path.join(BUILD_DIR, "not-found.html");
if (fs.existsSync(NOT_FOUND_SRC)) {
  fs.copyFileSync(NOT_FOUND_SRC, path.join(OUT_DIR, "404.html"));
  console.log("✅ 已复制 404.html");
}

// 写入 firebase.json
const firebaseConfig = {
  hosting: {
    public: "out",
    ignore: ["firebase.json", "**/.*", "**/node_modules/**"],
    cleanUrls: true,
    rewrites: [
      { source: "/", destination: `/${DEFAULT_LANG}/index.html` },
      ...LOCALES.map((lang) => ({
        source: `/${lang}`,
        destination: `/${lang}/index.html`,
      })),
    ],
  },
};
fs.writeFileSync(FIREBASE_JSON, JSON.stringify(firebaseConfig, null, 2));
console.log("\n⚙️ 已生成 firebase.json rewrites。");
console.log("🚀 构建完成，可执行：firebase deploy --only hosting\n");
