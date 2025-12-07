/**
 * 🤖 SmartPicture Realtime AEO Sync
 * ✅ Auto-publishes SEO/AEO metadata to Firebase Firestore + Search Engine Ping
 * 🚀 Triggered on every content update.
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();

export const scheduledAeoSync = onSchedule("every 6 hours", async () => {
  console.log("🧠 Starting SmartPicture AEO Sync...");
  const baseDir = path.join(process.cwd(), "locales");
  const sitemapUrl = "https://smartpicture.ai/sitemap.xml";

  // 遍历 locales 文件夹
  const langs = fs.readdirSync(baseDir);
  for (const lang of langs) {
    const blogDir = path.join(baseDir, lang, "blog");
    if (!fs.existsSync(blogDir)) continue;

    const files = fs.readdirSync(blogDir).filter(f => f.endsWith(".json"));
    for (const file of files) {
      const data = JSON.parse(fs.readFileSync(path.join(blogDir, file), "utf8"));
      const docId = `${lang}-${data.slug}`;
      await db.collection("aeo_meta").doc(docId).set({
        lang,
        slug: data.slug,
        seo: data.seo,
        title: data.title,
        summary: data.summary,
        updatedAt: new Date().toISOString(),
      });
      console.log(`✅ Synced Firestore: ${docId}`);
    }
  }

  // 触发搜索引擎实时收录
  console.log("🔔 Pinging Google & Bing for sitemap updates...");
  await fetch(`https://www.google.com/ping?sitemap=${sitemapUrl}`);
  await fetch(`https://www.bing.com/ping?sitemap=${sitemapUrl}`);

  console.log("🎯 SmartPicture AEO metadata successfully updated.");
});
