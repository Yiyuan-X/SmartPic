// src/components/AiDailySummary.tsx
import { getTodayRangeNews } from "@/lib/getNews";

const PICK = ["zh-CN", "en"]; // 选中文 & 英文作为摘要来源

export default async function AiDailySummary() {
  const today = await getTodayRangeNews(PICK, 2);
  const zh = today["zh-CN"] || [];
  const en = today["en"] || [];

  // 简单拼接式摘要（不使用红色，正文黑色）
  const zhHeads = zh.map((n) => n.title).slice(0, 2).join("；");
  const enHeads = en.map((n) => n.title).slice(0, 2).join("; ");

  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-[#0b3d91]">🧠 今日 AI 摘要</h3>
      <p className="mt-2 text-black">
        <strong>中文：</strong>{zhHeads || "今日中文新闻摘要即将更新…"}
      </p>
      <p className="mt-1 text-black">
        <strong>English:</strong> {enHeads || "English digest will be updated soon…"}
      </p>
    </section>
  );
}
