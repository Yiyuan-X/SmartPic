// src/components/AiDailySummary.tsx

// 直接使用静态占位数据（未来你可改成 API 或本地读取）
export default function AiDailySummary() {
  // 占位数据（没有新闻时的提示）
  const zhHeads = "今日中文新闻摘要即将更新…";
  const enHeads = "English digest will be updated soon…";

  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-[#0b3d91]">今日 AI 摘要</h3>

      <p className="mt-2 text-black">
        <strong>中文：</strong>{zhHeads}
      </p>

      <p className="mt-1 text-black">
        <strong>English:</strong> {enHeads}
      </p>
    </section>
  );
}
