"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { saveDraft, publishBlog } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Save, Send } from "lucide-react"
import Link from "next/link"
import type { Blog } from "@/lib/types"

export function BlogEditor({ blog }: { blog?: Blog }) {
  const router = useRouter()
  const { toast } = useToast()
  const [title, setTitle] = useState(blog?.title || "")
  const [content, setContent] = useState(blog?.content || "")
  const [tags, setTags] = useState(blog?.tags?.join(", ") || "")
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showSavedAnimation, setShowSavedAnimation] = useState(false)

  // Refs for debouncing
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  // const lastKeyPressRef = useRef<number>(0) // Removed

  // Auto-save when user stops typing for 5 seconds
  useEffect(() => {
    // Clear any existing auto-save timeout whenever relevant fields change
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only set a new timeout if there's content to save
    if (title.trim() || content.trim()) {
      timeoutRef.current = setTimeout(async () => {
        // Ensure not already saving from another trigger
        if (saving) {
          return;
        }
        // Double check if still relevant to save (e.g. content not cleared while waiting for timeout)
        if (!(title.trim() || content.trim())) {
          return;
        }

        setSaving(true);
        try {
          await saveDraft({
            id: blog?.id,
            title,
            content,
            tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
          });

          setLastSaved(new Date()); // Update last saved time

          toast({
            title: "Draft auto-saved",
            description: "Your blog draft has been automatically saved.",
          });

          // Navigate to the drafts page after successful auto-save
          router.push("/");

        } catch (error) {
          toast({
            title: "Error auto-saving draft",
            description: `There was an error automatically saving your draft. ${error instanceof Error ? error.message : String(error)}`,
            variant: "destructive",
          });
        } finally {
          setSaving(false);
        }
      }, 5000); // 5 seconds
    }

    // Cleanup function: clear the timeout if the component unmounts
    // or if dependencies change (triggering the effect to run again).
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [title, content, tags, blog?.id, router, toast, saving]);

  const handleSaveDraft = async () => {
    if (!title.trim() && !content.trim()) {
      toast({
        title: "Cannot save empty draft",
        description: "Please add a title or content to save",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const savedBlog = await saveDraft({
        id: blog?.id,
        title,
        content,
        tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
      })

      setLastSaved(new Date())
      setShowSavedAnimation(true)

      // Hide the animation after 2 seconds
      setTimeout(() => {
        setShowSavedAnimation(false)
      }, 2000)

      toast({
        title: "Draft saved",
        description: "Your blog draft has been saved",
      })
      router.push("/") // Redirect to homepage
    } catch (error) {
      toast({
        title: "Error saving draft",
        description: "There was an error saving your draft",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please add a title before publishing",
        variant: "destructive",
      })
      return
    }

    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please add content before publishing",
        variant: "destructive",
      })
      return
    }

    setPublishing(true)
    try {
      const publishedBlog = await publishBlog({
        id: blog?.id,
        title,
        content,
        tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
      })

      toast({
        title: "Blog published",
        description: "Your blog has been published successfully",
      })

      router.push("/") // Redirect to homepage
    } catch (error) {
      toast({
        title: "Error publishing",
        description: "There was an error publishing your blog",
        variant: "destructive",
      })
    } finally {
      setPublishing(false)
    }
  }

  // const handleKeyDown = () => { // Removed
  //   lastKeyPressRef.current = Date.now() // Removed
  // } // Removed

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 lg:py-12">
      <div className="flex flex-col gap-8 max-w-3xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="transition-all duration-300 hover:bg-purple-600/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to blogs
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {lastSaved && (
              <div className="flex items-center">
                <span
                  className={`text-sm text-muted-foreground transition-all duration-300 ${showSavedAnimation ? "text-green-500 scale-110" : ""}`}
                >
                  {showSavedAnimation ? "Saved!" : `Last saved: ${lastSaved.toLocaleTimeString()}`}
                </span>
              </div>
            )}
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={saving}
              className="transition-all duration-300 hover:bg-purple-600 hover:text-white border-purple-600 text-purple-600"
            >
              <Save className={`mr-2 h-4 w-4 ${saving ? "animate-spin" : ""}`} />
              {saving ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              className="bg-black-800 hover:bg-black-700 text-white transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg border border-purple-600"
              onClick={handlePublish}
              disabled={publishing}
            >
              <Send className={`mr-2 h-4 w-4 ${publishing ? "animate-spin" : ""}`} />
              {publishing ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>

        <Card className="border-purple-800/20 transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-6">
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter blog title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  // onKeyDown={handleKeyDown} // Removed
                  className="transition-all duration-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write your blog content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  // onKeyDown={handleKeyDown} // Removed
                  className="min-h-[300px] resize-y transition-all duration-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  placeholder="technology, programming, web development"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  // onKeyDown={handleKeyDown} // Removed
                  className="transition-all duration-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
