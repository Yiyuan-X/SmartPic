#!/usr/bin/env tsx
/**
 * fix-next-intl-final.mts (v2)
 * 1) 确认 messages 目录和 src/i18n/config.ts 存在
 * 2) 在 src/app 下创建 i18n.ts（Next 14 构建扫描 src/app）
 * 3) 清理根目录残留的 app/i18n.ts（避免覆盖 src/app）
 * 4) 确保 tsconfig.include 覆盖 src/i18n/**
 * 5) 清理 .next 并构建（可选启动）
 *
 * 用法：
 *   pnpm tsx scripts/fix-next-intl-final.mts          # build + start
 *   pnpm tsx scripts/fix-next-intl-final.mts --no-start  # 只 build
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = process.cwd();

const paths = {
  messagesDir: path.join(root, "messages"),
  srcI18nDir: path.join(root, "src", "i18n"),
  srcI18nConfig: path.join(root, "src", "i18n", "config.ts"),
  srcAppDir: path.join(root, "src", "app"),
  srcAppI18n: path.join(root, "src", "app", "i18n.ts"),
  appDir: path.join(root, "app"),
  appI18n: path.join(root, "app", "i18n.ts"),
  tsconfig: path.join(root, "tsconfig.json"),
  nextDir: path.join(root, ".next"),
};

const shouldStart = !process.argv.includes("--no-start");

function log(s: string) {
  console.log(s);
}

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function readJSON(p: string) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJSON(p: string, obj: any) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

log("🩵 [Smart Fix v2] 修复 next-intl 生产构建入口...\n");

// 1) 基础检查：messages & src/i18n/config.ts
if (!fs.existsSync(paths.messagesDir)) {
  console.error("❌ 未找到 /messages 目录（根目录）。请确保 messages/en.json、messages/zh.json 存在。");
  process.exit(1);
}
if (!fs.existsSync(paths.srcI18nConfig)) {
  console.error("❌ 未找到 src/i18n/config.ts。请先创建 next-intl 配置文件后再运行本脚本。");
  process.exit(1);
}

// 2) 在 src/app 下创建 i18n.ts，指向 src/i18n/config
ensureDir(paths.srcAppDir);
const srcAppI18nContent = `export { default } from '@/i18n/config';\n`;
fs.writeFileSync(paths.srcAppI18n, srcAppI18nContent, "utf8");
log("✅ 已修正: src/app/i18n.ts（确保导出指向 src/i18n/config）");

// 3) 删除旧的 app/i18n.ts，避免影响 Next 对 src/app 的检测
if (fs.existsSync(paths.appI18n)) {
  fs.rmSync(paths.appI18n);
  log("🧼 已移除: app/i18n.ts（避免与 src/app 冲突）");
}
try {
  if (fs.existsSync(paths.appDir) && fs.readdirSync(paths.appDir).length === 0) {
    fs.rmdirSync(paths.appDir);
    log("🧼 已移除空的 /app 目录");
  }
} catch {}

// 4) 确保 tsconfig.include 包含 src/i18n/**
if (fs.existsSync(paths.tsconfig)) {
  try {
    const ts = readJSON(paths.tsconfig);
    ts.include = ts.include || [];
    const needed = "src/i18n/**/*";
    if (!ts.include.includes(needed)) {
      ts.include.push(needed);
      writeJSON(paths.tsconfig, ts);
      log("🔧 已更新 tsconfig.json: include 加入 'src/i18n/**/*'");
    } else {
      log("✅ tsconfig.json 已包含 'src/i18n/**/*'");
    }
  } catch (e) {
    log("⚠️  读取/写入 tsconfig.json 失败，但不影响继续。");
  }
}

// 5) 清理 .next
if (fs.existsSync(paths.nextDir)) {
  log("🧹 清理 .next 缓存...");
  fs.rmSync(paths.nextDir, { recursive: true, force: true });
}

// 6) 构建 &（可选）启动
try {
  log("🏗️  正在执行：pnpm build");
  execSync("pnpm build", { stdio: "inherit" });
  if (shouldStart) {
    log("\n🚀 正在启动：pnpm start");
    execSync("pnpm start", { stdio: "inherit" });
  } else {
    log("\n✅ 构建完成（未启动）。可运行：pnpm start");
  }
} catch (e) {
  console.error("❌ 构建或启动失败，请查看上方日志。");
  process.exit(1);
}
