#!/usr/bin/env node
/**
 * 🔧 修复 firebase-functions/v2/https 路径问题
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const fnDir = path.resolve("functions");

console.log("🧩 [v6] 修复 firebase-functions/v2/https 模块路径...\n");

for (const file of fs.readdirSync(fnDir)) {
  if (!file.endsWith(".ts")) continue;
  const filePath = path.join(fnDir, file);
  let text = fs.readFileSync(filePath, "utf8");
  const before = text;

  // 回退 https.js → https
  text = text.replace(
    /from\s+["']firebase-functions\/v2\/https\.js["']/g,
    'from "firebase-functions/v2/https"'
  );

  if (text !== before) {
    fs.writeFileSync(filePath, text, "utf8");
    console.log(`✅ 已修复: ${file}`);
  }
}

console.log("\n🏗️ 重新构建...");
try {
  execSync(`cd ${fnDir} && rm -rf lib && pnpm run build`, { stdio: "inherit" });
  console.log("\n✅ 构建成功！现在可以部署：");
  console.log("firebase deploy --only functions:scheduledAeoSync");
} catch {
  console.error("\n❌ 构建仍有错误，请贴出日志。");
}
