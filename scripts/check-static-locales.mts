/**
 * 🧭 SmartPicture i18n Static Export Checker v1.0
 * 检测 Next.js 是否正确生成多语言静态页面
 */

import fs from "fs";
import path from "path";
import chalk from "chalk";

const outDir = path.resolve("out");
const layoutPath = path.resolve("src/app/[locale]/layout.tsx");

// 预期支持的语言
const EXPECTED_LANGS = ["en", "zh-TW", "ja", "ko", "fr", "de", "es", "pt"];

console.log(chalk.cyan("\n🌍 SmartPicture i18n Export Check Starting...\n"));

// --- Step 1: 检查 layout.tsx 是否存在 generateStaticParams() ---
if (!fs.existsSync(layoutPath)) {
  console.log(chalk.red("❌ 未找到 src/app/[locale]/layout.tsx"));
  process.exit(1);
}

const layoutContent = fs.readFileSync(layoutPath, "utf-8");
if (layoutContent.includes("generateStaticParams")) {
  console.log(chalk.green("✅ 检测到 generateStaticParams() 已定义。"));
} else {
  console.log(
    chalk.red(
      "❌ 未检测到 generateStaticParams()，请在 layout.tsx 顶部添加：\n" +
        "export function generateStaticParams() {\n" +
        "  return ['en','zh-TW','ja','ko','fr','de','es','pt'].map(locale => ({ locale }));\n" +
        "}"
    )
  );
  process.exit(1);
}

// --- Step 2: 检查 out 目录 ---
if (!fs.existsSync(outDir)) {
  console.log(chalk.red("❌ 未找到 out/ 目录，请先执行 `pnpm run build`"));
  process.exit(1);
}

const dirs = fs
  .readdirSync(outDir)
  .filter((f) => fs.statSync(path.join(outDir, f)).isDirectory());

console.log(chalk.blue("\n📁 已检测到的导出目录："));
dirs.forEach((dir) => console.log(" - " + dir));

const existingLangs = EXPECTED_LANGS.filter((lang) => dirs.includes(lang));
const missingLangs = EXPECTED_LANGS.filter((lang) => !dirs.includes(lang));

// --- Step 3: 输出检测结果 ---
console.log("\n📊 检查结果：");
if (existingLangs.length > 0) {
  console.log(chalk.green(`✅ 已生成语言：${existingLangs.join(", ")}`));
}
if (missingLangs.length > 0) {
  console.log(chalk.yellow(`⚠️ 缺少语言：${missingLangs.join(", ")}`));
  console.log(
    chalk.gray(
      "➡️ 请确认 generateStaticParams() 是否包含所有语言，并重新运行 `pnpm run build`。"
    )
  );
} else {
  console.log(chalk.green("🎉 所有语言目录已生成，静态导出完全正常。"));
}

// --- Step 4: 部署建议 ---
console.log("\n🚀 下一步：");
if (missingLangs.length === 0) {
  console.log(chalk.green("✅ 可以直接执行：firebase deploy --only hosting\n"));
} else {
  console.log(chalk.yellow("⚠️ 请修复缺失语言后再部署。\n"));
}
