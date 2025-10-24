import {listSlugs} from "@/lib/loadPost";
import {locales} from "@/lib/i18n.config";

export default async function sitemap() {
  const base = process.env.SITE_URL ?? "https://example.com";
  const now = new Date().toISOString();
  const blogs = listSlugs("blog");
  const news = listSlugs("news");
  const slugs = [...blogs, ...news];
  const urls: any[] = [];

  for (const l of locales) {
    urls.push({url: `${base}/${l}`, lastModified: now});
  }
  for (const s of slugs) {
    for (const l of locales) {
      urls.push({url: `${base}/${l}/${s.type}/${s.name}`, lastModified: now});
    }
  }
  return urls;
}
