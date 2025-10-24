import {GoogleGenerativeAI} from "@google/generative-ai";
import {glob} from "glob";
import fs from "fs";
import path from "path";

const langs = ["en","zh"];
const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  .getGenerativeModel({model: "gemini-2.5-flash-lite"});

const RE = /```json|```/g;

function outPath(lang, slug){ return `locales/${lang}/blog/${slug}.json`; }

async function runOne(mdPath) {
  const slug = path.basename(mdPath, ".md");
  const md = fs.readFileSync(mdPath, "utf8");
  for (const lang of langs) {
    const prompt = `请把以下 Markdown 生成【${lang}】本地化 HTML 并输出严格 JSON：
{
  "slug": "${slug}",
  "title": "包含核心关键词且自然",
  "description": "≤160字，含2-3关键词",
  "content": "<HTML正文，无内联样式>",
  "keywords": ["5-10关键词"],
  "seo_meta": {
    "title": "...",
    "description": "...",
    "og_title": "...",
    "og_description": "...",
    "og_image": "/og.png"
  }
}
原文：
${md}`.trim();

    const r = await model.generateContent(prompt);
    const json = JSON.parse(r.response.text().replace(RE,"").trim());
    fs.mkdirSync(path.dirname(outPath(lang, slug)), {recursive: true});
    fs.writeFileSync(outPath(lang, slug), JSON.stringify(json, null, 2));
    console.log(`✅ blog ${slug} -> ${lang}`);
  }
}

const files = await glob("content/blog/*.md");
for (const f of files) await runOne(f);
