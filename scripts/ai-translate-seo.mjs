import dotenv from "dotenv";
dotenv.config({ path: ".env.local" }); // ✅ 明确加载 .env.local

import { GoogleGenerativeAI } from "@google/generative-ai";
import { glob } from "glob";
import fs from "fs";
import path from "path";

// ✅ 环境变量
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

// ✅ 初始化 Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const aiModel = genAI.getGenerativeModel({ model: GEMINI_MODEL });

// ✅ 自动抓取 AI 新闻 (Google News RSS)
async function fetchNews() {
  const url = "https://news.google.com/rss/search?q=artificial+intelligence&hl=en-US&gl=US&ceid=US:en";
  const r = await fetch(url);
  if (!r.ok) {
    const text = await r.text();
    console.error("News fetch failed:", r.status, text);
    throw new Error("Failed to fetch news");
  }

  const xml = await r.text();
  // 提取新闻条目（简单正则版）
  const items = [...xml.matchAll(/<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>/g)].map(
    ([, title, link]) => ({ title, link })
  );

  // 取前 5 条
  return items.slice(0, 5);
}

// ✅ 输出翻译文件函数
const langs = ["en", "zh"];
const RE = /```json|```/g;
const outPath = (lang, slug) => `locales/${lang}/blog/${slug}.json`;

async function translateNewsItem(item) {
  const slug = item.title.replace(/[^\w]+/g, "-").toLowerCase();

  for (const lang of langs) {
    const prompt = `
请将以下新闻标题和内容生成${lang}版本的 SEO JSON，格式如下：
{
  "slug": "${slug}",
  "title": "新闻标题（包含核心关键词）",
  "description": "150字摘要",
  "content": "<HTML格式正文>",
  "keywords": ["ai","人工智能","科技新闻"],
  "seo_meta": {
    "title": "...",
    "description": "...",
    "og_title": "...",
    "og_description": "...",
    "og_image": "/og.png"
  }
}
原始新闻标题: ${item.title}
原文链接: ${item.link}
    `.trim();

    console.log(`🌍 Translating ${slug} → ${lang} ...`);

    try {
      const result = await aiModel.generateContent(prompt);
      const text = result.response.text().replace(RE, "").trim();
      const json = JSON.parse(text);

      fs.mkdirSync(path.dirname(outPath(lang, slug)), { recursive: true });
      fs.writeFileSync(outPath(lang, slug), JSON.stringify(json, null, 2));

      console.log(`✅ news ${slug} -> ${lang}`);
    } catch (err) {
      console.error(`❌ Error translating ${slug} (${lang}):`, err.message);
    }
  }
}

// ✅ 主流程
(async () => {
  console.log("📰 Fetching AI news...");
  const newsList = await fetchNews();

  for (const item of newsList) {
    await translateNewsItem(item);
  }

  console.log("🎉 All news fetched and translated!");
})();
