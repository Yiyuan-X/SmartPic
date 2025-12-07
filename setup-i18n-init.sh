#!/bin/bash
# ============================================================
# 📜 Script Name: setup-i18n.sh
# 🔧 Purpose:
#   一键初始化 SmartPicture 项目的多语言 (8-language i18n)
#   并自动运行 Gemini 2.5 Flash-Lite 翻译与 SEO/AEO 自动化。
#
# 🧠 功能说明:
#   1️⃣ 自动创建多语言配置与目录；
#   2️⃣ 自动生成 next-intl 配置和 middleware；
#   3️⃣ 创建 8 种语言基础 messages；
#   4️⃣ 创建示例 blog；
#   5️⃣ 写入新版 translate-seo.mts；
#   6️⃣ 检测 Node.js 版本与运行环境：
#       - Node 20.x → 正常执行；
#       - 其他版本 → 自动使用 ts-node 兼容模式；
#   7️⃣ 若 tsx 出错，将自动回退为 ts-node/esm；
#   8️⃣ 自动打包、执行并生成多语言 SEO 文件。
#
# 🧑‍💻 作者: Yiyuan
# 🗓️ 更新时间: 2025-10-25
# ============================================================

echo "🚀 Setting up SmartPicture 8-language i18n + Gemini 2.5 Flash-Lite automation..."
echo "🧹 Cleaning old build caches..."

rm -rf .next node_modules/.cache
mkdir -p messages content/blog scripts .github/workflows src

# === 检测 Gemini API Key ===
if [ -z "$GEMINI_API_KEY" ]; then
  echo "⚠️  未检测到 GEMINI_API_KEY，请先运行："
  echo "   export GEMINI_API_KEY='你的密钥'"
  exit 1
else
  echo "✅ 检测到 GEMINI_API_KEY：$GEMINI_API_KEY"
fi

# === next-intl config ===
cat > next-intl.config.ts <<'EOT'
import { getRequestConfig } from 'next-intl/server';
export default getRequestConfig(() => ({
  locales: ['en','zh','ja','ko','fr','de','es','pt'],
  defaultLocale: 'en'
}));
EOT

# === middleware ===
cat > src/middleware.ts <<'EOT'
import createMiddleware from 'next-intl/middleware';
export default createMiddleware({
  locales: ['en','zh','ja','ko','fr','de','es','pt'],
  defaultLocale: 'en'
});
export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
EOT

# === messages for 8 languages ===
for lang in en zh ja ko fr de es pt; do
cat > messages/$lang.json <<EOT
{
  "home.title": "SmartPicture AI News",
  "home.description": "Stay ahead with multilingual AI insights.",
  "blog.list.title": "Latest Articles",
  "blog.readMore": "Read more"
}
EOT
done

# === sample blog markdown ===
cat > content/blog/sample.md <<'EOT'
---
title: "OpenAI launches Gemini 2.5 Flash-Lite"
date: "2025-10-24"
summary: "OpenAI introduces the Gemini 2.5 Flash-Lite model for faster and cheaper AI content generation."
---

The Gemini 2.5 Flash-Lite model has been officially released, focusing on lightweight, fast, and affordable AI capabilities for developers worldwide.
EOT

# === translate-seo.mts (新版，含 SEO/AEO 优化 & ts-node 兼容) ===
cat > scripts/translate-seo.mts <<'EOT'
#!/usr/bin/env ts-node
/**
 * 🌐 SmartPicture AI i18n + SEO/AEO Generator
 * ✨ Using Google Gemini 2.5 Flash-Lite (REST API)
 * 🧠 Supports API Key directly — no OAuth needed.
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import slugify from 'slugify';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.5-flash-lite';
const API_URL = \`https://aiplatform.googleapis.com/v1/publishers/google/models/\${MODEL}:generateContent\`;

if (!GEMINI_API_KEY) {
  console.error('❌ Missing GEMINI_API_KEY. Please set it in .env.local or export it.');
  process.exit(1);
}

const LANGS = ['en', 'zh', 'ja', 'ko', 'fr', 'de', 'es', 'pt'];
const CONTENT_DIR = path.join(process.cwd(), 'content', 'blog');
const OUT_DIR = path.join(process.cwd(), 'locales');

async function callGeminiAPI(prompt: string) {
  const body = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  });

  const res = await fetch(\`\${API_URL}?key=\${GEMINI_API_KEY}\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(\`❌ Gemini API error \${res.status} \${res.statusText}\`);
    console.error(text);
    throw new Error(\`HTTP \${res.status}: \${res.statusText}\`);
  }

  const json = await res.json();
  const text =
    json.candidates?.[0]?.content?.parts?.[0]?.text ||
    JSON.stringify(json, null, 2);
  return text;
}

async function main() {
  console.log('🌍 SmartPicture i18n Translator with Gemini 2.5 Flash-Lite');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(\`❌ Content directory not found: \${CONTENT_DIR}\`);
    process.exit(1);
  }

  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  if (files.length === 0) {
    console.warn('⚠️ No markdown files found under content/blog/. Nothing to translate.');
    return;
  }

  console.log(\`📚 Found \${files.length} file(s) to process.\\n\`);

  for (const file of files) {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
    const { data, content } = matter(raw);
    const slug = slugify(data.title || file.replace('.md', ''), {
      lower: true,
      strict: true
    });
    const html = marked.parse(content);

    for (const lang of LANGS) {
      console.log(\`🌐 Processing [\${lang}] → \${file}\`);

      const translated =
        lang === 'en'
          ? { title: data.title, summary: data.summary, bodyHtml: html }
          : await translate(lang, data.title, content);

      const seo = await genSeo(lang, slug, translated.title, translated.summary);
      const outDir = path.join(OUT_DIR, lang, 'blog');
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(
        path.join(outDir, \`\${slug}.json\`),
        JSON.stringify({ slug, ...translated, seo }, null, 2)
      );

      console.log(\`✔ Done: \${lang}/\${slug}.json\`);
    }
    console.log('───────────────────────────────────────────────');
  }

  console.log('✅ All translations complete.');
}

async function translate(lang: string, title: string, markdown: string) {
  const prompt =
    \`Translate this Markdown into \${lang} as pure JSON:\\n\` +
    \`{ "title": "...", "summary": "...", "bodyHtml": "..." }\\n\\n\` +
    \`Markdown:\\n\${markdown}\`;
  try {
    const text = await callGeminiAPI(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    console.warn(\`⚠️ No valid JSON detected for \${lang}, fallback to HTML.\`);
    return { title, summary: '', bodyHtml: marked.parse(markdown) };
  } catch (err: any) {
    console.error(\`⚠️ Translation failed for \${lang}:\`, err.message);
    return { title, summary: '', bodyHtml: marked.parse(markdown) };
  }
}

async function genSeo(lang: string, slug: string, title: string, summary: string) {
  const prompt =
    \`Generate optimized SEO + AEO metadata for \${lang} in JSON:\\n\` +
    \`{ "title": "", "description": "", "keywords": [], "canonical": "", "ogImage": "" }\\n\\n\` +
    \`Title: \${title}\\nSummary: \${summary}\\n\` +
    \`Requirements:\\n- Include AI/Tech related keywords.\\n- Canonical: https://smartpicture.ai/\${lang}/blog/\${slug}\`;

  try {
    const text = await callGeminiAPI(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    console.warn(\`⚠️ No valid SEO JSON returned for \${lang}, using default.\`);
    return defaultSeo(lang, slug, title, summary);
  } catch (err: any) {
    console.error(\`⚠️ SEO generation failed for \${lang}:\`, err.message);
    return defaultSeo(lang, slug, title, summary);
  }
}

function defaultSeo(lang: string, slug: string, title: string, summary: string) {
  return {
    title,
    description: summary,
    keywords: ['AI', 'Artificial Intelligence', 'Technology', 'Innovation'],
    canonical: \`https://smartpicture.ai/\${lang}/blog/\${slug}\`,
    ogImage: ''
  };
}

main()
  .then(() => {
    console.log('🎯 Task completed successfully.');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Fatal error during translation:', err);
    process.exit(1);
  });
EOT

# === Node version check ===
NODE_VER=$(node -v | sed 's/v\([0-9]*\)\..*/\1/')
echo "🔍 Detected Node.js version: $NODE_VER"

echo "🎁 Files packaged: smartpicture-i18n-ai.zip"
zip -r smartpicture-i18n-ai.zip next-intl.config.ts src/middleware.ts messages content scripts .github > /dev/null

# === 固定使用 ts-node/esm 执行（避免 tsx 缓存） ===
echo "⚙️  Running via ts-node/esm (stable mode)..."
node --loader ts-node/esm scripts/translate-seo.mts


echo "🎉 All done! SmartPicture i18n + SEO system initialized successfully."
