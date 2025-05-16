"use client"

"use client"

import { useState, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getAllBlogs } from "@/lib/actions"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { Edit, Eye, Trash } from "lucide-react"
import type { Blog } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { deleteBlog } from "@/lib/actions"

export function BlogList() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchBlogs = async () => {
      console.log(`[BlogList] useEffect triggered. Pathname: ${pathname}, SearchParams: ${searchParams.toString()}`);
      setLoading(true);
      try {
        const data = await getAllBlogs()
        setBlogs(data)
        console.log("[BlogList] Fetched blogs. Count:", data.length, "Titles:", data.map(b => b.title));
      } catch (error) {
        toast({
          title: "Error fetching blogs",
          description: "There was an error loading your blogs",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBlogs()
  }, [pathname, searchParams])

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this blog?")) {
      try {
        await deleteBlog(id)
        setBlogs(blogs.filter((blog) => blog.id !== id))
        toast({
          title: "Blog deleted",
          description: "Your blog has been deleted successfully",
        })
      } catch (error) {
        toast({
          title: "Error deleting blog",
          description: "There was an error deleting your blog",
          variant: "destructive",
        })
      }
    }
  }

  const publishedBlogs = blogs.filter((blog) => blog.published)
  const draftBlogs = blogs.filter((blog) => !blog.published)

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin-slow text-purple-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      </div>
    )
  }

  if (blogs.length === 0) {
    return (
      <Card className="border-purple-800/20 animate-fade-in">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">You haven't created any blogs yet</p>
          <Link href="/editor/new">
            <Button className="bg-black-800 hover:bg-black-700 text-white transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg border border-purple-600">
              Create your first blog
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="all" className="w-full animate-fade-in">
      <TabsList className="mb-4">
        <TabsTrigger
          value="all"
          className="transition-all duration-300 data-[state=active]:bg-black-800 data-[state=active]:text-white data-[state=active]:border-purple-600 data-[state=active]:border"
        >
          All ({blogs.length})
        </TabsTrigger>
        <TabsTrigger
          value="published"
          className="transition-all duration-300 data-[state=active]:bg-black-800 data-[state=active]:text-white data-[state=active]:border-purple-600 data-[state=active]:border"
        >
          Published ({publishedBlogs.length})
        </TabsTrigger>
        <TabsTrigger
          value="drafts"
          className="transition-all duration-300 data-[state=active]:bg-black-800 data-[state=active]:text-white data-[state=active]:border-purple-600 data-[state=active]:border"
        >
          Drafts ({draftBlogs.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all">
        <div className="grid gap-4">
          {blogs.map((blog, index) => (
            <div key={blog.id} className={`animate-slide-up stagger-${(index % 3) + 1}`}>
              <BlogCard blog={blog} onDelete={handleDelete} />
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="published">
        <div className="grid gap-4">
          {publishedBlogs.length > 0 ? (
            publishedBlogs.map((blog, index) => (
              <div key={blog.id} className={`animate-slide-up stagger-${(index % 3) + 1}`}>
                <BlogCard blog={blog} onDelete={handleDelete} />
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">No published blogs yet</p>
          )}
        </div>
      </TabsContent>

      <TabsContent value="drafts">
        <div className="grid gap-4">
          {draftBlogs.length > 0 ? (
            draftBlogs.map((blog, index) => (
              <div key={blog.id} className={`animate-slide-up stagger-${(index % 3) + 1}`}>
                <BlogCard blog={blog} onDelete={handleDelete} />
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">No drafts yet</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}

function BlogCard({ blog, onDelete }: { blog: Blog; onDelete: (id: string) => void }) {
  return (
    <Card className="border-purple-800/20 transition-all duration-300 hover:shadow-md hover:border-purple-600/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{blog.title || "Untitled"}</CardTitle>
            <CardDescription>Last updated: {formatDate(blog.updatedAt)}</CardDescription>
          </div>
          {blog.published ? (
            <Badge className="bg-purple-600 animate-pulse-subtle">Published</Badge>
          ) : (
            <Badge variant="outline" className="border-purple-500 text-purple-500 animate-pulse-subtle">
              Draft
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground line-clamp-2">{blog.content || "No content"}</p>
        {blog.tags && blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {blog.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="transition-all duration-300 hover:bg-purple-600 hover:text-white"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(blog.id)}
          className="transition-all duration-300 hover:bg-red-500 hover:text-white"
        >
          <Trash className="h-4 w-4 mr-1" />
          Delete
        </Button>
        <Link href={`/editor/${blog.id}`}>
          <Button
            variant="outline"
            size="sm"
            className="transition-all duration-300 hover:bg-purple-600 hover:text-white border-purple-600 text-purple-600"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </Link>
        <Link href={`/blog/${blog.id}`}>
          <Button
            size="sm"
            className="bg-black-800 hover:bg-black-700 text-white transition-all duration-300 hover:scale-105"
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
