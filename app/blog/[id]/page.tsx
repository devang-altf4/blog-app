import { getBlogById } from "@/lib/actions"
import { formatDate } from "@/lib/utils"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default async function BlogPage({
  params,
}: {
  params: { id: string }
}) {
  const blog = await getBlogById(params.id)

  if (!blog) {
    notFound()
  }

  return (
    <main className="container mx-auto py-6 px-4 md:px-6 lg:py-12">
      <div className="flex flex-col gap-8 max-w-3xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="transition-all duration-300 hover:bg-purple-600/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to blogs
            </Button>
          </Link>
          <Link href={`/editor/${blog.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="transition-all duration-300 hover:bg-purple-600 hover:text-white border-purple-600 text-purple-600"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>

        <article className="prose prose-invert max-w-none animate-slide-up">
          <div className="flex items-center gap-2 mb-2">
            {blog.published ? (
              <Badge className="bg-purple-600 animate-pulse-subtle">Published</Badge>
            ) : (
              <Badge variant="outline" className="border-purple-500 text-purple-500 animate-pulse-subtle">
                Draft
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">{formatDate(blog.updatedAt)}</span>
          </div>

          <h1 className="text-4xl font-bold mb-4 animate-float">{blog.title}</h1>

          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {blog.tags.map((tag: string, index: number) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className={`transition-all duration-300 hover:bg-purple-600 hover:text-white animate-slide-up stagger-${(index % 3) + 1}`}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-6 whitespace-pre-wrap animate-slide-up stagger-2">{blog.content}</div>
        </article>
      </div>
    </main>
  )
}
