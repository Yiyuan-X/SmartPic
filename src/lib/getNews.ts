// src/lib/getNews.ts
import { collection, getDocs, orderBy, query, where, limit, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

export async function getLatestNewsByLang(lang: string, n = 3) {
  const q = query(
    collection(db, "ai_news"),
    where("lang", "==", lang),
    orderBy("date", "desc"),
    limit(n)
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() as any }));
}

export async function getTodayRangeNews(langs: string[], maxPerLang = 2) {
  // 最近 36 小时窗口，容忍时区差
  const since = Timestamp.fromDate(new Date(Date.now() - 36 * 3600 * 1000));
  const all: Record<string, any[]> = {};
  for (const lang of langs) {
    const q = query(
      collection(db, "ai_news"),
      where("lang", "==", lang),
      where("date", ">", since),
      orderBy("date", "desc"),
      limit(maxPerLang)
    );
    const snap = await getDocs(q);
    all[lang] = snap.docs.map((d) => ({ id: d.id, ...d.data() as any }));
  }
  return all;
}
