/**
 * 🔧 SmartPicture Firebase i18n Hosting Fixer
 * 自动检测 out/ 多语言目录，生成 firebase.json 正确 rewrites
 */

import fs from "fs";
import path from "path";

const firebasePath = path.resolve("firebase.json");
const outPath = path.resolve("out");

if (!fs.existsSync(outPath)) {
  console.error("❌ 没找到 out/ 目录，请先运行 `pnpm run build` 再试。");
  process.exit(1);
}

// 自动读取 out/ 下的语言目录
const langs = fs
  .readdirSync(outPath)
  .filter((f) =>
    fs.statSync(path.join(outPath, f)).isDirectory()
  )
  .filter((dir) => /^[a-z]{2,3}(-[A-Z]{2})?$/.test(dir));

if (langs.length === 0) {
  console.error("⚠️ 没有检测到多语言目录（例如 en, zh-TW），请确认构建正确。");
  process.exit(1);
}

// 生成 rewrites 规则
const rewrites = [
  { source: "/", destination: `/${langs[0]}/index.html` },
  ...langs.map((lang) => ({
    source: `/${lang}`,
    destination: `/${lang}/index.html`,
  })),
];

const firebaseConfig = {
  hosting: {
    public: "out",
    ignore: ["firebase.json", "**/.*", "**/node_modules/**"],
    cleanUrls: true,
    trailingSlash: false,
    rewrites,
  },
};

fs.writeFileSync(firebasePath, JSON.stringify(firebaseConfig, null, 2));
console.log("✅ 已自动更新 firebase.json：");
console.log(firebaseConfig);

console.log("\n🚀 下一步：执行以下命令部署：");
console.log("firebase deploy --only hosting\n");
