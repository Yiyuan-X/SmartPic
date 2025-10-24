import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import fetch from 'node-fetch';

// =========================
// 配置
// =========================
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.5-flash-lite';

const LOCALES_DIR = path.join(process.cwd(), 'locales');
const SOURCE_PATH = path.join(LOCALES_DIR, 'zh.json');

// 默认目标语言（可用 --only 覆盖）
const DEFAULT_TARGETS = ['en', 'zh-TW', 'ja', 'ko', 'fr', 'de', 'es', 'pt'];

// CLI 选项
const argv = process.argv.slice(2);
const isDryRun = argv.includes('--dry-run');
const isWatch = argv.includes('--watch');
const noSEO = argv.includes('--no-seo');

const onlyArg = argv.find(a => a.startsWith('--only'));
const ONLY = onlyArg
  ? onlyArg.replace('--only', '').replace('=', '').split(',').map(s => s.trim()).filter(Boolean)
  : DEFAULT_TARGETS;

if (!GEMINI_KEY) {
  console.error('❌ Missing GEMINI_API_KEY in environment variables.');
  process.exit(1);
}

// =========================
// 工具函数
// =========================
const readJsonSafe = (p: string) => {
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.warn(`⚠️ Failed to parse ${p}, fallback to empty object.`);
    return {};
  }
};

const writeJsonPretty = (p: string, obj: any) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8');
};

// 递归对比，找出 target 缺失或与 source 相同（需覆盖）的键值
function findDiff(source: any, target: any): any {
  const diff: any = {};
  for (const key of Object.keys(source)) {
    const s = source[key];
    const t = target ? target[key] : undefined;

    if (s && typeof s === 'object' && !Array.isArray(s)) {
      const sub = findDiff(s, t || {});
      if (Object.keys(sub).length > 0) diff[key] = sub;
    } else {
      // 需要翻译的情况：target 不存在，或 target 值与 source 一样（说明未翻译）
      if (t === undefined || t === s) {
        diff[key] = s;
      }
    }
  }
  return diff;
}

// 深度合并：将 newObj 写入 oldObj
function deepMerge(oldObj: any, newObj: any): any {
  for (const key of Object.keys(newObj)) {
    const v = newObj[key];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if (!oldObj[key]) oldObj[key] = {};
      deepMerge(oldObj[key], v);
    } else {
      oldObj[key] = v;
    }
  }
  return oldObj;
}

// 清理 ```json ... ``` 包裹，提取纯 JSON
function cleanFencedJson(text: string): string {
  if (!text) return '';
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  // 兜底：尽力截取第一个大括号块
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

// 调用 Gemini REST
async function callGemini(prompt: string): Promise<string> {
  const url = `https://aiplatform.googleapis.com/v1/publishers/google/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }]}],
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Gemini API ${res.status} ${res.statusText}\n${text}`);
  }

  // 解析候选文本
  try {
    const json = JSON.parse(text);
    return json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  } catch {
    // 某些情况下返回多段行文本，直接原文返回给上层清理
    return text.trim();
  }
}

// =========================
// 翻译（仅翻译 diff）
// =========================
async function translateDiff(fromLangName: string, toLangName: string, diffJson: any): Promise<any> {
  const prompt = [
    `You are a professional translator. Translate the following JSON from ${fromLangName} to ${toLangName}.`,
    `- Keep all keys unchanged; translate values only.`,
    `- Return **pure JSON** only, no comments, no markdown fences.`,
    `- Preserve placeholders like {name}, {count}.`,
    `- Keep punctuation and emojis.`,
    ``,
    `${JSON.stringify(diffJson, null, 2)}`
  ].join('\n');

  const raw = await callGemini(prompt);
  const cleaned = cleanFencedJson(raw);
  try {
    return JSON.parse(cleaned);
  } catch (e: any) {
    throw new Error(`Invalid JSON from Gemini (${toLangName}): ${e.message}\n---RAW---\n${raw}\n---CLEANED---\n${cleaned}`);
  }
}

// =========================
// SEO + AEO 生成
// =========================
function collectSourceContext(obj: any, max = 1500): string {
  // 简单拼接 source 文案，供 SEO/AEO 摘要
  const lines: string[] = [];
  function walk(o: any, prefix: string[] = []) {
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        walk(v, [...prefix, k]);
      } else {
        lines.push(`${[...prefix, k].join('.')}: ${String(v)}`);
      }
    }
  }
  walk(obj);
  const joined = lines.join('\n');
  return joined.length > max ? joined.slice(0, max) : joined;
}

async function genSEOAEO(langCode: string, langName: string, targetJson: any): Promise<any> {
  const context = collectSourceContext(targetJson);
  const prompt = [
    `Generate SEO & AEO JSON for language: ${langName}.`,
    `Return a JSON object with fields: {`,
    `  "title": string,`,
    `  "description": string, // under 160 chars`,
    `  "keywords": string[],  // 3-8 concise keywords`,
    `  "canonical": string,   // keep generic path, no domain`,
    `  "ogImage": string,     // empty if unknown`,
    `  "aiTopics": string[]   // 3-6 topic tags for LLMs`,
    `}`,
    `Rules:`,
    `- Use natural ${langName} wording.`,
    `- Focus on high-impact, intent-rich terms (AEO).`,
    `- No markdown fences, return pure JSON only.`,
    ``,
    `Context (subset of site strings in ${langName}):`,
    context
  ].join('\n');

  const raw = await callGemini(prompt);
  const cleaned = cleanFencedJson(raw);
  try {
    const parsed = JSON.parse(cleaned);
    // 兜底规范化
    parsed.keywords ||= [];
    parsed.aiTopics ||= [];
    parsed.ogImage ||= '';
    parsed.canonical ||= `/${langCode}`;
    if (typeof parsed.description === 'string') {
      parsed.description = parsed.description.slice(0, 160);
    }
    return parsed;
  } catch (e: any) {
    return {
      title: 'SmartPicture',
      description: 'Multilingual AI-powered content.',
      keywords: ['AI', 'Automation', 'Multilingual', 'SmartPicture'],
      canonical: `/${langCode}`,
      ogImage: '',
      aiTopics: ['Generative AI', 'AI Applications', 'Content Localization']
    };
  }
}

// =========================
// 主流程
// =========================
async function runOnce() {
  console.log(`\n🌍 SmartPicture Translator v10  |  REST: ${MODEL}`);
  console.log(`🎯 Targets: ${ONLY.join(', ')}  |  ${isDryRun ? 'Dry Run' : 'Write Mode'}  |  SEO/AEO: ${noSEO ? 'OFF' : 'ON'}`);

  if (!fs.existsSync(SOURCE_PATH)) {
    console.error('❌ locales/zh.json not found. Please create it as the source language file.');
    process.exit(1);
  }

  const zhData = readJsonSafe(SOURCE_PATH);

  for (const code of ONLY) {
    const nameMap: Record<string, string> = {
      'en': 'English',
      'zh-TW': 'Traditional Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'fr': 'French',
      'de': 'German',
      'es': 'Spanish',
      'pt': 'Portuguese'
    };
    const langName = nameMap[code] || code;

    const targetPath = path.join(LOCALES_DIR, `${code}.json`);
    const targetData = readJsonSafe(targetPath);

    const diff = findDiff(zhData, targetData);
    const diffCount = Object.keys(diff).length;

    if (diffCount === 0) {
      console.log(`✅ ${langName} (${code}) 已同步，无需更新`);
      // 即使内容没变，也可更新 SEO
      if (!noSEO) await updateSEOFile(code, langName, targetData);
      continue;
    }

    if (isDryRun) {
      console.log(`🔎 ${langName} (${code}) 待更新字段（预览）：`);
      console.log(JSON.stringify(diff, null, 2));
      // 预览也可生成 SEO（从现有 targetData）
      if (!noSEO) await updateSEOFile(code, langName, targetData);
      continue;
    }

    try {
      console.log(`🌐 翻译中 → ${langName} (${code}) ...`);
      const translated = await translateDiff('Simplified Chinese', langName, diff);
      const merged = deepMerge(targetData, translated);
      writeJsonPretty(targetPath, merged);
      console.log(`✔ 已更新：locales/${code}.json`);
      if (!noSEO) await updateSEOFile(code, langName, merged);
    } catch (e: any) {
      console.error(`❌ 翻译失败：${langName} (${code})\n${e.message}`);
    }
  }

  console.log('\n🎉 同步完成！');
}

async function updateSEOFile(code: string, langName: string, data: any) {
  const seo = await genSEOAEO(code, langName, data);
  const seoPath = path.join(LOCALES_DIR, `${code}.seo.json`);
  writeJsonPretty(seoPath, seo);
  console.log(`🔧 SEO/AEO 已更新：locales/${code}.seo.json`);
}

// =========================
// 监听模式
// =========================
async function start() {
  await runOnce();

  if (isWatch) {
    console.log('\n👀 正在监听 zh.json 变化...（保存即自动同步）');
    chokidar.watch(SOURCE_PATH, { ignoreInitial: true }).on('change', async () => {
      console.log('\n🔁 检测到 zh.json 修改，开始同步...');
      await runOnce();
    });
  }
}

start().catch(err => {
  console.error('💥 Uncaught error:', err);
  process.exit(1);
});
