#!/usr/bin/env bash
# ============================================================
# 🌐 SmartPicture AI i18n + SEO/AEO Auto Setup
# ✨ Gemini 2.5 Flash-Lite + Next.js 14 + ts-node/esm
# 🧠 双模式自动检测：初始化 / 自动执行
# ============================================================

echo ""
echo "🚀 Starting SmartPicture 8-language i18n + Gemini 2.5 Flash-Lite automation..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# === 清理旧缓存 ===
echo "🧹 Cleaning old build caches..."
rm -rf .next node_modules/.cache dist temp *.tsbuildinfo
mkdir -p scripts content/blog messages src .github/workflows

# === 检测 Gemini API Key ===
if [ -z "$GEMINI_API_KEY" ]; then
  if [ -f ".env.local" ]; then
    export GEMINI_API_KEY=$(grep GEMINI_API_KEY .env.local | cut -d '=' -f2)
  fi
fi

if [ -z "$GEMINI_API_KEY" ]; then
  echo "❌ Error: Missing GEMINI_API_KEY. Please add it to .env.local or export it."
  echo "   Example: export GEMINI_API_KEY='your-api-key-here'"
  exit 1
fi
echo "✅ GEMINI_API_KEY detected: ${GEMINI_API_KEY:0:20}********"
echo ""

# === 检查初始化状态 ===
INIT_REQUIRED=false
if [ ! -f "next-intl.config.ts" ] || [ ! -f "src/middleware.ts" ]; then
  INIT_REQUIRED=true
fi

# ============================================================
# 🧩 [1] 初始化模式：自动生成 i18n 配置与脚本
# ============================================================
if [ "$INIT_REQUIRED" = true ]; then
  echo "🆕 Initialization mode detected — generating i18n environment..."
  
  # --- next-intl config ---
  cat > next-intl.config.ts <<'EOT'
import { getRequestConfig } from 'next-intl/server';
export default getRequestConfig(() => ({
  locales: ['en','zh','ja','ko','fr','de','es','pt'],
  defaultLocale: 'en'
}));
EOT

  # --- middleware ---
  mkdir -p src
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

  # --- messages (8 语言基础文案) ---
  mkdir -p messages
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

  # --- sample blog ---
  mkdir -p content/blog
  cat > content/blog/sample.md <<'EOT'
---
title: "OpenAI launches Gemini 2.5 Flash-Lite"
date: "2025-10-24"
summary: "OpenAI introduces the Gemini 2.5 Flash-Lite model for faster and cheaper AI content generation."
---

The Gemini 2.5 Flash-Lite model has been officially released, focusing on lightweight, fast, and affordable AI capabilities for developers worldwide.
EOT

  echo "✅ i18n configuration initialized successfully."
fi

# ============================================================
# 🧩 [2] translate-seo.mts (若不存在则写入最新版本)
# ============================================================
if [ ! -f "scripts/translate-seo.mts" ]; then
  echo "🧠 Writing new translate-seo.mts..."
  mkdir -p scripts
  cat > scripts/translate-seo.mts <<'EOT'
#!/usr/bin/env ts-node
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import slugify from 'slugify';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.5-flash-lite';
const API_URL = `https://aiplatform.googleapis.com/v1/publishers/google/models/${MODEL}:generateContent`;

if (!GEMINI_API_KEY) {
  console.error('❌ Missing GEMINI_API_KEY.');
  process.exit(1);
}

const LANGS = ['en', 'zh', 'ja', 'ko', 'fr', 'de', 'es', 'pt'];
const CONTENT_DIR = path.join(process.cwd(), 'content', 'blog');
const OUT_DIR = path.join(process.cwd(), 'locales');
const PUBLIC_DIR = path.join(process.cwd(), 'public');

async function callGeminiAPI(prompt) {
  const res = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${text}`);
  }
  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function main() {
  console.log('🌍 Running SmartPicture i18n Translator...');
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  const sitemapUrls = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
    const { data, content } = matter(raw);
    const slug = slugify(data.title || file.replace('.md', ''), { lower: true, strict: true });
    const html = marked.parse(content);

    for (const lang of LANGS) {
      const translated = lang === 'en'
        ? { title: data.title, summary: data.summary, bodyHtml: html }
        : await translate(lang, data.title, content);
      const seo = await genSeo(lang, slug, translated.title, translated.summary);
      const outDir = path.join(OUT_DIR, lang, 'blog');
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, `${slug}.json`), JSON.stringify({ slug, ...translated, seo }, null, 2));
      sitemapUrls.push(`https://smartpicture.ai/${lang}/blog/${slug}`);
    }
  }
  generateSitemap(sitemapUrls);
}

async function translate(lang, title, markdown) {
  const prompt = `Translate this Markdown into ${lang} as JSON: { "title": "", "summary": "", "bodyHtml": "" }\n\n${markdown}`;
  try {
    const text = await callGeminiAPI(prompt);
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { title, summary: '', bodyHtml: marked.parse(markdown) };
  } catch {
    return { title, summary: '', bodyHtml: marked.parse(markdown) };
  }
}

async function genSeo(lang, slug, title, summary) {
  const prompt = `Generate SEO + AEO metadata for ${lang} in JSON: { "title": "", "description": "", "keywords": [], "canonical": "", "ogImage": "" }\nTitle: ${title}\nSummary: ${summary}\nCanonical: https://smartpicture.ai/${lang}/blog/${slug}`;
  try {
    const text = await callGeminiAPI(prompt);
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : defaultSeo(lang, slug, title, summary);
  } catch {
    return defaultSeo(lang, slug, title, summary);
  }
}

function defaultSeo(lang, slug, title, summary) {
  return {
    title,
    description: summary || title,
    keywords: ['AI', 'Artificial Intelligence', 'Technology', 'Innovation'],
    canonical: `https://smartpicture.ai/${lang}/blog/${slug}`,
    ogImage: ''
  };
}

function generateSitemap(urls) {
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(u => `  <url><loc>${u}</loc></url>`),
    '</urlset>'
  ].join('\n');
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemap);
  console.log(`🗺 Sitemap generated (${urls.length} URLs).`);
}

main().then(() => console.log('✅ All done!')).catch(console.error);
EOT
fi

# ============================================================
# 🧩 [3] 运行翻译 + SEO 自动化
# ============================================================
echo "⚙️  Running translation and SEO/AEO generation..."
node --loader ts-node/esm scripts/translate-seo.mts

echo ""
echo "🎉 SmartPicture i18n + SEO/AEO system initialized successfully."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
