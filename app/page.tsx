import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BlogList } from "@/components/blog-list"
import { Plus } from "lucide-react"

export const metadata: Metadata = {
  title: "Blog Platform",
  description: "Write, edit, save, and publish your blogs",
}

export default function Home() {
  return (
    <main className="container mx-auto py-6 px-4 md:px-6 lg:py-12">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between animate-slide-up">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Your Blogs</h1>
            <p className="text-muted-foreground">Manage your drafts and published posts</p>
          </div>
          <Link href="/editor/new">
            <Button className="bg-black-800 hover:bg-black-700 text-white transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg border border-purple-600">
              <Plus className="mr-2 h-4 w-4" />
              New Blog
            </Button>
          </Link>
        </div>
        <BlogList />
      </div>
    </main>
  )
}
