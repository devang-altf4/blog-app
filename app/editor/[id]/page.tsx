import { BlogEditor } from "@/components/blog-editor"
import { getBlogById } from "@/lib/actions"
import { notFound } from "next/navigation"

export default async function EditorPage({
  params,
}: {
  params: { id: string }
}) {
  // If it's a new blog, render empty editor
  if (params.id === "new") {
    return <BlogEditor />
  }

  // Otherwise, fetch the blog and render editor with data
  const blog = await getBlogById(params.id)

  if (!blog) {
    notFound()
  }

  return <BlogEditor blog={blog} />
}
