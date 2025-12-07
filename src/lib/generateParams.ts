import fs from "fs";
import path from "path";  // ✅ 必须有这一行


export async function generateStaticParamsFor(type: "blog" | "news") {
  const locales = ["en", "zh", "de", "fr", "ja", "ko", "es", "it"]; // 支持的语言
  const baseDir = path.join(process.cwd(), "src/locales");
  const paths: { locale: string; slug: string }[] = [];

  for (const locale of locales) {
    const dir = path.join(baseDir, locale, type);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const slug = file.replace(/\.(json|mdx?|md)$/i, "");
      paths.push({ locale, slug });
    }
  }

  return paths;
}
