import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPost } from "@/lib/data";
import { MarkdownBody } from "@/components/markdown-body";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post?.title) return {};
  return { title: post.title };
}

export default async function NewsPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post || !post.title) notFound();

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-16 px-6 md:px-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <span className="font-mono">
            {new Date(post.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
          </span>
          {post.tag && (
            <span className="border border-neutral-700 px-2 py-0.5">{post.tag}</span>
          )}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-10 break-words">{post.title}</h1>
        <MarkdownBody content={post.body} />
        <div className="mt-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-neutral-300 hover:text-white border border-neutral-400 hover:border-white px-4 py-2 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            返回主页
          </Link>
        </div>
      </div>
    </div>
  );
}
