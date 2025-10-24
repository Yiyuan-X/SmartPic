import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import {GoogleGenerativeAI} from "@google/generative-ai";

const langs = ["en","zh"];
const gen = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({model:"gemini-2.5-flash-lite"});
const RE = /```json|```/g;

async function fetchNews() {
  const key = process.env.NEWS_API_KEY;
  const url = `https://newsapi.org/v2/top-headlines?category=technology&language=en&pageSize=5&apiKey=${key}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("Failed to fetch news");
  const j = await r.json();
  return (j.articles||[]).map(a => ({
    title: a.title, description: a.description, url: a.url,
    source: a.source?.name, publishedAt: a.publishedAt,
    slug: (a.title||a.url||"news").toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,60)
  }));
}

function out(lang, slug){ return `locales/${lang}/news/${slug}.json`; }

async function processItem(item) {
  for (const lang of langs) {
    const prompt = `为以下英文新闻生成【${lang}】本地化 JSON（严格）：
{
  "slug": "${item.slug}",
  "title": "...",
  "description": "≤160字",
  "content": "<HTML正文，含来源引用链接>",
  "keywords": ["5-10关键词"],
  "seo_meta": {
    "title": "...",
    "description": "...",
    "og_title": "...",
    "og_description": "...",
    "og_image": "/og.png"
  }
}
新闻：
Title: ${item.title}
Abstract: ${item.description}
URL: ${item.url}
Source: ${item.source}`.trim();

    const r = await gen.generateContent(prompt);
    const json = JSON.parse(r.response.text().replace(RE,"").trim());
    fs.mkdirSync(path.dirname(out(lang, item.slug)), {recursive: true});
    fs.writeFileSync(out(lang, item.slug), JSON.stringify(json, null, 2));
    console.log(`✅ news ${item.slug} -> ${lang}`);
  }
}

const items = await fetchNews();
for (const it of items) await processItem(it);
