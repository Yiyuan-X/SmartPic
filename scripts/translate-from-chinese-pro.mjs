/**
 * 🌏 SmartPicture i18n Translator v8 (Vertex AI 版本)
 * 主语言：简体中文 (zh.json)
 * 支持：
 *   ✅ Vertex AI API (gemini-2.5-flash-lite)
 *   ✅ 并发多语言翻译
 *   ✅ 实时监听 (--watch)
 *   ✅ Dry Run 模式 (--dry-run)
 *   ✅ 流式与普通请求 (--stream)
 * 作者: Yiyuan (AI Tech IP)
 */

import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import chokidar from "chokidar";

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash-lite";
const localesDir = path.join(process.cwd(), "locales");
const zhPath = path.join(localesDir, "zh.json");

// 命令行参数
const isWatch = process.argv.includes("--watch");
const isDryRun = process.argv.includes("--dry-run");
const isStream = process.argv.includes("--stream"); // 启用流式模式

// 多语言配置
const TARGET_LOCALES = [
  { code: "en", name: "English" },
  { code: "zh-TW", name: "Traditional Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "es", name: "Spanish" },
];

// ==== 校验 ====
if (!GEMINI_KEY) {
  console.error("❌ 请先设置 GEMINI_API_KEY 环境变量。");
  process.exit(1);
}
if (!fs.existsSync(zhPath)) {
  console.error("❌ 未找到 locales/zh.json（主语言文件）。");
  process.exit(1);
}

const zhData = JSON.parse(fs.readFileSync(zhPath, "utf8"));

// ==== 工具函数 ====
function findDiff(source, target) {
  const diff = {};
  for (const key in source) {
    if (typeof source[key] === "object" && source[key] !== null) {
      const sub = findDiff(source[key], target?.[key] || {});
      if (Object.keys(sub).length > 0) diff[key] = sub;
    } else if (!target || !target[key] || target[key] === source[key]) {
      diff[key] = source[key];
    }
  }
  return diff;
}

function deepMerge(oldObj, newObj) {
  for (const key in newObj) {
    if (typeof newObj[key] === "object" && newObj[key] !== null) {
      if (!oldObj[key]) oldObj[key] = {};
      deepMerge(oldObj[key], newObj[key]);
    } else {
      oldObj[key] = newObj[key];
    }
  }
  return oldObj;
}

// ==== Vertex AI 请求 ====
async function callGeminiAPI(prompt, stream = false) {
  const endpoint = stream
    ? `https://aiplatform.googleapis.com/v1/publishers/google/models/${MODEL}:streamGenerateContent?key=${GEMINI_KEY}`
    : `https://aiplatform.googleapis.com/v1/publishers/google/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }]}],
    }),
  });

  if (stream) {
    const text = await res.text();
    // 合并流式返回的多个 JSON 块
    const chunks = text
      .split("\n")
      .filter((line) => line.trim().startsWith("{"))
      .map((line) => JSON.parse(line));

    const allParts = chunks
      .flatMap((c) => c.candidates?.[0]?.content?.parts || [])
      .map((p) => p.text)
      .join("");
    return allParts;
  } else {
    const json = await res.json();
    return json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  }
}

async function translateJSON(json, fromLang, toLang) {
  const prompt = `
你是一位专业的翻译，请将以下 JSON 文本从 ${fromLang} 翻译为 ${toLang}。
保持 key 不变，仅翻译 value。
返回纯 JSON，不包含注释或其他说明。

${JSON.stringify(json, null, 2)}
  `;

  const output = await callGeminiAPI(prompt, isStream);
  if (!output) return null;

  try {
    return JSON.parse(output);
  } catch {
    console.error(`⚠️ ${toLang} 翻译返回无效 JSON：`, output);
    return null;
  }
}

// ==== 主逻辑 ====
async function translateAll() {
  console.log("\n🌏 SmartPicture i18n Translator v8 (Vertex AI 版)");
  console.log(`⚙️ 模式：${isDryRun ? "Dry Run（仅预览）" : "翻译执行"} | ${isStream ? "流式模式" : "普通模式"}\n`);

  const tasks = TARGET_LOCALES.map(async ({ code, name }) => {
    const outPath = path.join(localesDir, `${code}.json`);
    let existing = {};
    if (fs.existsSync(outPath)) {
      existing = JSON.parse(fs.readFileSync(outPath, "utf8"));
    } else {
      fs.writeFileSync(outPath, "{}", "utf8");
      console.log(`📁 已创建 ${name} (${code}) 文件`);
    }

    const diff = findDiff(zhData, existing);
    if (Object.keys(diff).length === 0) {
      console.log(`✅ ${name} (${code}) 已是最新。`);
      return;
    }

    if (isDryRun) {
      console.log(`🔍 [DryRun] ${name} (${code}) 将更新以下字段：`);
      console.log(JSON.stringify(diff, null, 2));
      return;
    }

    console.log(`🌐 翻译中 → ${name} (${code})...`);
    const translated = await translateJSON(diff, "Simplified Chinese", name);
    if (translated) {
      const merged = deepMerge(existing, translated);
      fs.writeFileSync(outPath, JSON.stringify(merged, null, 2), "utf8");
      console.log(`✅ 已更新：${name} (${code}) → locales/${code}.json`);
    }
  });

  await Promise.all(tasks);
  console.log("\n🎉 所有语言同步完成！");
}

// ==== Watch 模式 ====
if (isWatch) {
  console.log("👀 正在监听 zh.json 变化...（保存即自动翻译）");
  chokidar.watch(zhPath).on("change", async () => {
    console.log("\n🔁 检测到 zh.json 修改，开始自动翻译...");
    await translateAll();
  });
} else {
  await translateAll();
}
