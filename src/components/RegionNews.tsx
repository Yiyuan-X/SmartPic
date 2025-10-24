// src/components/RegionNews.tsx
import Link from "next/link";

export function RegionBlock({
  title, items
}: { title: string; items: { id: string; title: string; url: string; date: any }[] }) {
  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#0b3d91]">{title}</h3>
      </div>
      <div className="mt-3 space-y-3">
        {items.map((n) => {
          const d = new Date(n.date?.seconds ? n.date.seconds * 1000 : Date.now()).toLocaleDateString();
          return (
            <div key={n.id} className="border border-gray-100 rounded-xl p-4">
              <div className="font-medium text-black">{n.title}</div>
              <div className="text-gray-500 text-sm mt-1">📅 {d}</div>
              <Link href={n.url} target="_blank"
                className="inline-block mt-2 px-3 py-1 rounded-md bg-[#0b3d91] text-white hover:bg-[#092d70]">
                阅读全文 →
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
