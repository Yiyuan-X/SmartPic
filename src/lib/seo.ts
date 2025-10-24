import type {Metadata} from "next";
import {locales} from "./i18n.config";

export function buildAlternates(locale: string, slug?: string) {
  const languages: Record<string,string> = {};
  for (const l of locales) languages[l] = slug ? `/${l}/blog/${slug}` : `/${l}`;
  languages["x-default"] = slug ? `/en/blog/${slug}` : `/en`;
  return {alternates: {languages}};
}

export function baseSiteMetadata(): Metadata {
  const base = process.env.SITE_URL || "https://example.com";
  return {
    metadataBase: new URL(base),
    icons: {icon: "/favicon.ico"},
    openGraph: {images: ["/og.png"], type: "website"},
    twitter: {card: "summary_large_image"}
  };
}

export function buildPostMetadata(post: any, locale: string): Metadata {
  return {
    ...baseSiteMetadata(),
    title: post?.seo_meta?.title ?? post?.title,
    description: post?.seo_meta?.description ?? post?.description,
    openGraph: {
      title: post?.seo_meta?.og_title ?? post?.title,
      description: post?.seo_meta?.og_description ?? post?.description,
      images: post?.seo_meta?.og_image ? [post.seo_meta.og_image] : ["/og.png"]
    },
    other: {keywords: Array.isArray(post?.keywords) ? post.keywords.join(",") : undefined},
    ...buildAlternates(locale, post?.slug)
  };
}
