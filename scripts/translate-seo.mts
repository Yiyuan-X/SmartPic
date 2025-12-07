#!/usr/bin/env ts-node
/**
 * 🌐 SmartPicture AI i18n + SEO/AEO Generator
 * ✨ Powered by Google Gemini 2.5 Flash-Lite (REST API)
 * 🧠 Automatically generates translations + SEO + sitemap.xml
 * -----------------------------------------------------------
 * ✅ Compatible with Node 20+, ts-node/esm or tsx
 */

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { marked } from 'marked'
import slugify from 'slugify'

// === 🔧 Configuration ===
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const MODEL = 'gemini-2.5-flash-lite'
const API_URL = `https://aiplatform.googleapis.com/v1/publishers/google/models/${MODEL}:generateContent`

if (!GEMINI_API_KEY) {
  console.error('❌ Missing GEMINI_API_KEY. Please set it in .env.local or export it.')
  process.exit(1)
}

const LANGS = ['en', 'zh', 'ja', 'ko', 'fr', 'de', 'es', 'pt']
const CONTENT_DIR = path.join(process.cwd(), 'content', 'blog')
const OUT_DIR = path.join(process.cwd(), 'locales')
const PUBLIC_DIR = path.join(process.cwd(), 'public')

// === 🌍 Call Gemini API ===
async function callGeminiAPI(prompt: string) {
  const res = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    })
  })

  if (!res.ok) {
    const err = await res.text()
    console.error(`❌ Gemini API Error ${res.status}: ${res.statusText}`)
    console.error(err)
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }

  const data = await res.json()
  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    JSON.stringify(data, null, 2)
  )
}

// === 🚀 Main Workflow ===
async function main() {
  console.log('🌍 SmartPicture i18n + SEO/AEO Generator (Gemini 2.5 Flash-Lite)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`❌ Missing content directory: ${CONTENT_DIR}`)
    process.exit(1)
  }

  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'))
  if (!files.length) {
    console.warn('⚠️ No markdown files found under content/blog/.')
    return
  }

  console.log(`📚 Found ${files.length} article(s) to process.\n`)

  const sitemapEntries: string[] = []

  for (const file of files) {
    const filePath = path.join(CONTENT_DIR, file)
    const raw = fs.readFileSync(filePath, 'utf8')
    const { data, content } = matter(raw)
    const slug = slugify(data.title || file.replace('.md', ''), { lower: true, strict: true })
    const html = marked.parse(content)

    for (const lang of LANGS) {
      console.log(`🌐 Translating [${lang}] → ${file}`)

      const translated =
        lang === 'en'
          ? { title: data.title, summary: data.summary, bodyHtml: html }
          : await translate(lang, data.title, content)

      const seo = await genSeo(lang, slug, translated.title, translated.summary)
      const outDir = path.join(OUT_DIR, lang, 'blog')
      fs.mkdirSync(outDir, { recursive: true })
      const outPath = path.join(outDir, `${slug}.json`)
      fs.writeFileSync(outPath, JSON.stringify({ slug, ...translated, seo }, null, 2))

      sitemapEntries.push(`https://smartpicture.ai/${lang}/blog/${slug}`)
      console.log(`✔ Done: ${lang}/${slug}.json`)
    }
    console.log('───────────────────────────────────────────────')
  }

  await generateSitemap(sitemapEntries)
  console.log('✅ All translations + SEO + sitemap generated successfully.')
}

// === 🌏 Translation ===
async function translate(lang: string, title: string, markdown: string) {
  const prompt = [
    `Translate the following Markdown into ${lang} and return JSON only:`,
    `{ "title": "", "summary": "", "bodyHtml": "" }`,
    ``,
    markdown
  ].join('\n')

  try {
    const text = await callGeminiAPI(prompt)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    console.warn(`⚠️ No valid JSON detected for ${lang}, fallback to HTML.`)
    return { title, summary: '', bodyHtml: marked.parse(markdown) }
  } catch (err: any) {
    console.error(`⚠️ Translation failed for ${lang}:`, err.message)
    return { title, summary: '', bodyHtml: marked.parse(markdown) }
  }
}

// === 🔍 SEO & AEO Generation ===
async function genSeo(lang: string, slug: string, title: string, summary: string) {
  const prompt = [
    `Generate optimized SEO + AEO metadata in JSON for ${lang}:`,
    `{ "title": "", "description": "", "keywords": [], "canonical": "", "ogImage": "" }`,
    ``,
    `Title: ${title}`,
    `Summary: ${summary}`,
    `Canonical: https://smartpicture.ai/${lang}/blog/${slug}`,
    `Include AI, Tech, Innovation keywords.`
  ].join('\n')

  try {
    const text = await callGeminiAPI(prompt)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    return defaultSeo(lang, slug, title, summary)
  } catch {
    return defaultSeo(lang, slug, title, summary)
  }
}

function defaultSeo(lang: string, slug: string, title: string, summary: string) {
  return {
    title,
    description: summary || title,
    keywords: ['AI', 'Artificial Intelligence', 'Technology', 'Innovation'],
    canonical: `https://smartpicture.ai/${lang}/blog/${slug}`,
    ogImage: ''
  }
}

// === 🗺 Generate sitemap.xml ===
async function generateSitemap(urls: string[]) {
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(u => `  <url><loc>${u}</loc></url>`),
    '</urlset>'
  ].join('\n')

  fs.mkdirSync(PUBLIC_DIR, { recursive: true })
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemap)
  console.log(`🗺 Sitemap generated with ${urls.length} URLs.`)
}

// === 🏁 Execute ===
main()
  .then(() => console.log('🎉 SmartPicture i18n + SEO/AEO completed.'))
  .catch(err => console.error('❌ Fatal Error:', err))
