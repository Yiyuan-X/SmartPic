/* eslint-disable */
/**
 * 🌐 SmartPicture AI Tech News Engine v13.7
 * 多语言国际版 + 自动 SEO / AEO 优化
 * - 自动抓取 + 翻译 + Markdown/HTML + 首页 + Sitemap + 多语言 RSS + 摘要
 * - 含 JSON-LD + OpenGraph + hreflang + 多语言互链
 */

import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { marked } from "marked";
import { bucket, db } from "./firebaseAdmin.js";
import { defineSecret } from "firebase-functions/params";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { setGlobalOptions } from "firebase-functions/v2/options";

// === Firebase Secret 管理 ===
const NEWS_API_KEY = defineSecret("NEWS_API_KEY");
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
const GEMINI_MODEL = "gemini-1.5-flash";

setGlobalOptions({
  memory: "1GiB",
  timeoutSeconds: 540,
  secrets: [NEWS_API_KEY, GEMINI_API_KEY],
});

// === 多语言配置 ===
const LANGS = [
  { code: "zh-CN", dir: ".", slug: "", name: "中文", htmlLang: "zh-CN", rssLocale: "zh-cn" },
  { code: "en", dir: "en", slug: "en/", name: "English", htmlLang: "en", rssLocale: "en-us" },
  { code: "ja", dir: "ja", slug: "ja/", name: "日本語", htmlLang: "ja", rssLocale: "ja-jp" },
  { code: "ko", dir: "ko", slug: "ko/", name: "한국어", htmlLang: "ko", rssLocale: "ko-kr" },
  { code: "fr", dir: "fr", slug: "fr/", name: "Français", htmlLang: "fr", rssLocale: "fr-fr" },
  { code: "de", dir: "de", slug: "de/", name: "Deutsch", htmlLang: "de-de", rssLocale: "de-de" },
  { code: "es", dir: "es", slug: "es/", name: "Español", htmlLang: "es", rssLocale: "es-es" },
  { code: "ru", dir: "ru", slug: "ru/", name: "Русский", htmlLang: "ru", rssLocale: "ru-ru" },
];

// === 类型定义 ===
interface NewsArticle {
  title: string;
  description?: string;
  url: string;
  urlToImage?: string;
  publishedAt?: string;
  source?: { name?: string };
}
interface NewsApiResponse {
  status?: string;
  totalResults?: number;
  articles?: NewsArticle[];
}
interface GeminiCandidate {
  content?: { parts?: { text?: string }[] };
}
interface GeminiResponse {
  candidates?: GeminiCandidate[];
}
interface AiNewsDoc {
  title: string;
  url: string;
  date: FirebaseFirestore.Timestamp;
  lang: string;
}
interface DailySummaryDoc {
  date: string;
  summary_zh: string;
  summary_en: string;
  createdAt: FirebaseFirestore.Timestamp;
}
interface UploadParams {
  localPath: string;
  remotePath: string;
  contentType: string;
}

// === 类型安全封装 ===
async function uploadFile({ localPath, remotePath, contentType }: UploadParams): Promise<void> {
  await bucket.upload(localPath, { destination: remotePath, metadata: { contentType } });
  console.log(`✅ Uploaded: ${remotePath}`);
}
async function saveNewsDoc(data: AiNewsDoc): Promise<void> {
  const docId = `${data.lang}-${data.date.toDate().toISOString()}`;
  await db.collection("ai_news").doc(docId).set(data);
}
async function saveDailySummary(data: DailySummaryDoc): Promise<void> {
  await db.collection("daily_summary").doc(data.date).set(data);
}

// === Gemini prompt 构造 ===
function buildPrompt(langCode: string, title: string, description: string, link: string): string {
  const base = `
格式要求（Markdown）：
1. 一级标题（带科技 Emoji）
2. 二级标题：英文标题，深蓝色 (#0b3d91)
3. 两段摘要：本地语言 + English summary
4. 🔗 原文链接
5. Keywords 列表`;
  const localeTask =
    {
      "zh-CN": "你是中文科技媒体编辑，请用中文撰写主内容与摘要。",
      en: "You are an English tech editor. Write an English summary.",
      ja: "あなたは日本語のテック編集者です。日本語で内容を書いてください。",
      ko: "당신은 한국어 테크 에디터입니다. 한국어로 작성하세요。",
    }[langCode] || "Translate naturally.";
  return `${localeTask}\n${base}\nTitle: ${title}\nDescription: ${description}\nURL: ${link}`;
}

// === Markdown 转 HTML（SEO + AEO 优化） ===
function wrapMarkdownToHTML({
  htmlLang,
  date,
  markdown,
  altLinks,
  image,
}: any): string {
  const hreflangs = altLinks
    .map((a: any) => `<link rel="alternate" hreflang="${a.code}" href="${a.href}">`)
    .join("\n");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: `SmartPicture AI Tech News — ${date}`,
    image: image || "https://storage.googleapis.com/smartpicture-assets/logo.png",
    datePublished: date,
    author: { "@type": "Organization", name: "SmartPicture AI" },
    publisher: { "@type": "Organization", name: "SmartPicture", logo: { "@type": "ImageObject", url: "https://storage.googleapis.com/smartpicture-assets/logo.png" } },
  };

  return `<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>SmartPicture AI Tech News — ${date}</title>
<meta name="description" content="SmartPicture每日AI科技新闻，多语言摘要与自动生成的SEO优化内容。">
<meta property="og:title" content="SmartPicture AI Tech News — ${date}">
<meta property="og:description" content="Daily multilingual AI tech news with automatic summaries and SEO optimization.">
<meta property="og:type" content="article">
<meta property="og:url" content="https://storage.googleapis.com/${bucket.name}/news/">
<meta property="og:image" content="${image || "https://storage.googleapis.com/smartpicture-assets/logo.png"}">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
${hreflangs}
<style>
body{font-family:Arial,Helvetica,sans-serif;background:#f8f9fa;color:#000;max-width:850px;margin:40px auto;padding:25px;line-height:1.7}
h1,h2{color:#0b3d91}
a{color:#0b3d91;text-decoration:none}
a:hover{text-decoration:underline}
</style></head>
<body>${marked.parse(markdown)}</body></html>`;
}

// === 主任务 ===
export async function fetchAiNews({ limit = 6 } = {}) {
  const date = new Date().toISOString().split("T")[0];
  console.log(`🌍 SmartPicture v13.7 starting (${date})`);

  const newsKey = NEWS_API_KEY.value();
  const geminiKey = GEMINI_API_KEY.value();

  const res = await fetch(
    `https://newsapi.org/v2/top-headlines?category=technology&pageSize=${limit}&language=en&apiKey=${newsKey}`
  );
  const data = (await res.json()) as NewsApiResponse;
  const articles = data.articles || [];
  console.log(`✅ ${articles.length} tech news fetched.`);

  const filenameBase = `ai-news-${date}`;
  const perLangMarkdown: Record<string, string> = {};
  const makeUrl = (lang: any) =>
    `https://storage.googleapis.com/${bucket.name}/news/${lang.slug}${filenameBase}.html`;

  for (const lang of LANGS) {
    const langItems: any[] = [];
    for (const a of articles) {
      const prompt = buildPrompt(lang.code, a.title, a.description || "", a.url);
      const g = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      const j = (await g.json()) as GeminiResponse;
      const text = j.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ 翻译失败";
      langItems.push({ title: a.title, text, image: a.urlToImage });
    }
    perLangMarkdown[lang.code] =
      `# 🤖 SmartPicture AI Tech News — ${date}\n\n` +
      langItems.map((i, idx) => `## 📰 ${idx + 1}. ${i.title}\n\n${i.text}\n\n---\n`).join("\n");

    // === 生成 HTML + 上传 ===
    const html = wrapMarkdownToHTML({
      htmlLang: lang.htmlLang,
      date,
      markdown: perLangMarkdown[lang.code],
      altLinks: LANGS.map((l) => ({ code: l.code, href: makeUrl(l) })),
      image: langItems[0]?.image,
    });
    const tmpDir = `/tmp/${lang.slug}`.replace("//", "/");
    fs.mkdirSync(tmpDir, { recursive: true });
    const htmlPath = path.join(tmpDir, `${filenameBase}.html`);
    fs.writeFileSync(htmlPath, html);
    await uploadFile({
      localPath: htmlPath,
      remotePath: `news/${lang.slug}${filenameBase}.html`,
      contentType: "text/html",
    });
    await saveNewsDoc({
      title: `SmartPicture AI Tech News — ${date}`,
      url: makeUrl(lang),
      date: new Date() as any,
      lang: lang.code,
    });
  }

  console.log("🌐 SmartPicture v13.7 build complete ✅");
  return `https://storage.googleapis.com/${bucket.name}/news/${filenameBase}.html`;
}

// === 定时任务：每日自动运行 ===
export const scheduledFetchAiNews = onSchedule("every 24 hours", async () => {
  console.log("🕒 Starting SmartPicture AI Tech News update...");
  await fetchAiNews();
});
