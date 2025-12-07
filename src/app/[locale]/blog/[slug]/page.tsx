import { notFound } from "next/navigation";
import { loadPost } from "@/lib/loadPost";
import { buildPostMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { generateStaticParamsFor } from "@/lib/generateParams";

// ✅ 自动生成静态路径参数（关键修复点）
export async function generateStaticParams() {
  return generateStaticParamsFor("blog");
}

// ✅ 生成 SEO 元数据
export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const post = loadPost(params.locale, "blog", params.slug);
  if (!post) return {};
  return buildPostMetadata(post, params.locale);
}

// ✅ 页面主体
export default function Page({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const post = loadPost(params.locale, "blog", params.slug);
  if (!post) return notFound();
  return (
    <article className="prose mx-auto py-10">
      <h1>{post.title}</h1>
      <p className="text-gray-500">{post.description}</p>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
