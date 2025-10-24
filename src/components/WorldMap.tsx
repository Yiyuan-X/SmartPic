// src/components/WorldMap.tsx
"use client";
import { useRouter } from "next/navigation";

export default function WorldMap() {
  const r = useRouter();

  const regions = [
    { label: "中文", lang: "zh-CN", box: "translate(70,120)", w: 120, h: 60 }, // 东亚
    { label: "English", lang: "en", box: "translate(80,40)", w: 130, h: 60 }, // 北美
    { label: "日本語", lang: "ja", box: "translate(220,110)", w: 80, h: 40 }, // 日本
    { label: "한국어", lang: "ko", box: "translate(200,110)", w: 80, h: 40 }, // 韩国
    { label: "Français", lang: "fr", box: "translate(180,70)", w: 100, h: 40 }, // 欧西
    { label: "Deutsch", lang: "de", box: "translate(200,70)", w: 100, h: 40 }, // 德语区
    { label: "Español", lang: "es", box: "translate(160,90)", w: 100, h: 40 }, // 西语区
    { label: "Русский", lang: "ru", box: "translate(250,60)", w: 110, h: 40 }, // 俄语区
  ];

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="px-4 pt-4 text-[#0b3d91] font-semibold">🌍 Global Languages</div>
      <svg viewBox="0 0 400 220" className="w-full h-[260px]">
        {/* 背景海洋 */}
        <rect x="0" y="0" width="400" height="220" fill="#eef4ff" />
        {/* 简化的大陆块（装饰） */}
        <ellipse cx="90" cy="80" rx="70" ry="35" fill="#cfe1ff" />
        <ellipse cx="240" cy="90" rx="110" ry="45" fill="#cfe1ff" />
        <ellipse cx="320" cy="150" rx="70" ry="30" fill="#cfe1ff" />
        {/* 语言热点框 */}
        {regions.map((rg) => (
          <g key={rg.lang} transform={rg.box} className="cursor-pointer"
             onClick={() => r.push(`/news/${rg.lang}`)}>
            <rect width={rg.w} height={rg.h} rx="10" fill="#0b3d91" opacity="0.12" />
            <text x={10} y={rg.h/2 + 5} fill="#0b3d91" className="text-sm">{rg.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
