import fs from "fs";
import path from "path";

export function loadPost(locale: string, type: "blog"|"news", slug: string) {
  const p = path.join(process.cwd(), `locales/${locale}/${type}/${slug}.json`);
  if (!fs.existsSync(p)) return null;
  const json = JSON.parse(fs.readFileSync(p, "utf8"));
  json.slug ||= slug; json.type ||= type;
  return json;
}

export function listSlugs(type: "blog"|"news") {
  const base = path.join(process.cwd(), "content", type === "blog" ? "blog" : "news");
  const names = fs.existsSync(base) ? fs.readdirSync(base) : [];
  return names
    .filter(n => n.endsWith(".md"))
    .map(n => ({type, name: n.replace(/\.md$/, "")}));
}
