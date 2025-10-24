#!/bin/bash
echo "🚀 Setting up SmartPicture 8-language i18n + Gemini SEO automation..."

mkdir -p messages content/blog scripts .github/workflows src

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

# === sample Markdown ===
cat > content/blog/sample.md <<'EOT'
---
title: "OpenAI launches Gemini 2.5 Flash-Lite"
date: "2025-10-24"
summary: "OpenAI introduces the Gemini 2.5 Flash-Lite model for faster and cheaper AI content generation."
---

The Gemini 2.5 Flash-Lite model has been officially released, focusing on lightweight, fast, and affordable AI capabilities for developers worldwide.
EOT

# === translate & SEO script ===
cat > scripts/translate-seo.mts <<'EOT'
#!/usr/bin/env ts-node
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import slugify from 'slugify';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY');

const LANGS = ['en','zh','ja','ko','fr','de','es','pt'];
const MODEL_NAME = 'gemini-2.5-flash-lite';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const CONTENT_DIR = path.join(process.cwd(), 'content', 'blog');
const OUT_DIR = path.join(process.cwd(), 'locales');

async function main() {
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
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
      console.log(`✔ ${lang}/${slug}.json`);
    }
  }
  console.log('✅ Translation complete');
}

async function translate(lang, title, markdown) {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const prompt = \`Translate this Markdown into \${lang} as JSON {title, summary, bodyHtml}.\nMarkdown:\n\${markdown}\`;
  const res = await model.generateContent(prompt);
  try { return JSON.parse(res.response.text()); }
  catch { return { title, summary: '', bodyHtml: marked.parse(markdown) }; }
}

async function genSeo(lang, slug, title, summary) {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const prompt = \`Generate SEO JSON for \${lang}: {title, description, keywords, canonical, ogImage}.\nTitle:\${title}\nSummary:\${summary}\`;
  const res = await model.generateContent(prompt);
  try { return JSON.parse(res.response.text()); }
  catch {
    return { title, description: summary, keywords: ['AI'], canonical: \`https://smartpicture.ai/\${lang}/blog/\${slug}\`, ogImage: '' };
  }
}

main().catch(console.error);
EOT

# === GitHub Actions ===
mkdir -p .github/workflows
cat > .github/workflows/i18n-build.yml <<'EOT'
name: I18N Build & Commit
on:
  push:
    paths:
      - 'content/blog/**.md'
  workflow_dispatch:
jobs:
  translate:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - run: pnpm i
      - name: Translate with Gemini
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: pnpm tsx scripts/translate-seo.mts
      - name: Commit JSON outputs
        run: |
          git config user.name github-actions
          git config user.email github-actions@users.noreply.github.com
          git add locales/
          git commit -m "chore: auto i18n build" || echo "No changes"
          git push
EOT

# === 打包 ===
zip -r smartpicture-i18n-ai.zip next-intl.config.ts src/middleware.ts messages content scripts .github > /dev/null
echo "🎉 Done! File generated: smartpicture-i18n-ai.zip"
