import {notFound} from "next/navigation";
import {loadPost} from "@/lib/loadPost";
import {buildPostMetadata} from "@/lib/seo";
import type {Metadata} from "next";

export async function generateMetadata({params}:{params:{locale:string; slug:string}}): Promise<Metadata> {
  const post = loadPost(params.locale, "news", params.slug);
  if (!post) return {};
  return buildPostMetadata(post, params.locale);
}

export default function Page({params}:{params:{locale:string; slug:string}}) {
  const post = loadPost(params.locale, "news", params.slug);
  if (!post) return notFound();
  return (
    <article className="prose mx-auto py-10">
      <h1>{post.title}</h1>
      <p className="text-gray-500">{post.description}</p>
      <div dangerouslySetInnerHTML={{__html: post.content}} />
    </article>
  );
}
