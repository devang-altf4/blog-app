"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import type { Blog, BlogInput } from "./types"

// Mock database for demo purposes
// HMR-safe in-memory store for development
declare global {
  // eslint-disable-next-line no-var
  var __blogs_dev_store: Blog[] | undefined
}

let blogs: Blog[]

if (process.env.NODE_ENV === 'production') {
  blogs = []
} else {
  if (!globalThis.__blogs_dev_store) {
    globalThis.__blogs_dev_store = []
  }
  blogs = globalThis.__blogs_dev_store as Blog[]
}

// Generate a random ID
function generateId() {
  return Math.random().toString(36).substring(2, 15)
}

// Get all blogs
export async function getAllBlogs(): Promise<Blog[]> {
  noStore(); // Opt out of caching for this function
  console.log('[getAllBlogs] Reading blogs. Current count:', blogs.length, blogs.map(b => b.title));
  // Sort by updatedAt, newest first
  return [...blogs].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

// Get blog by ID
export async function getBlogById(id: string): Promise<Blog | null> {
  return blogs.find((blog) => blog.id === id) || null
}

// Save draft
export async function saveDraft(input: BlogInput): Promise<Blog> {
  const now = new Date().toISOString()

  if (input.id) {
    // Update existing blog
    const index = blogs.findIndex((blog) => blog.id === input.id)

    if (index !== -1) {
      const updatedBlog = {
        ...blogs[index],
        title: input.title,
        content: input.content,
        tags: input.tags,
        published: false, // Ensure saving as draft marks it as not published
        updatedAt: now,
      }

      blogs[index] = updatedBlog
      console.log('[publishBlog] Updated existing blog. New blogs count:', blogs.length, blogs.map(b => b.title));
      revalidatePath("/")
      revalidatePath(`/blog/${input.id}`)
      revalidatePath(`/editor/${input.id}`)
      return updatedBlog
    }
  }

  // Create new blog
  const newBlog: Blog = {
    id: generateId(),
    title: input.title,
    content: input.content,
    tags: input.tags,
    published: false,
    createdAt: now,
    updatedAt: now,
  }

  blogs.push(newBlog)
  console.log('[publishBlog] Created new blog. New blogs count:', blogs.length, blogs.map(b => b.title));
  revalidatePath("/")
  revalidatePath(`/blog/${newBlog.id}`)
  revalidatePath(`/editor/${newBlog.id}`)
  return newBlog
}

// Publish blog
export async function publishBlog(input: BlogInput): Promise<Blog> {
  console.log('[publishBlog] Called with input title:', input.title);
  const now = new Date().toISOString()

  if (input.id) {
    // Update existing blog
    const index = blogs.findIndex((blog) => blog.id === input.id)

    if (index !== -1) {
      const updatedBlog = {
        ...blogs[index],
        title: input.title,
        content: input.content,
        tags: input.tags,
        published: true,
        updatedAt: now,
      }

      blogs[index] = updatedBlog
      console.log('[publishBlog] Updated existing blog. New blogs count:', blogs.length, blogs.map(b => b.title));
      revalidatePath("/")
      revalidatePath(`/blog/${input.id}`)
      revalidatePath(`/editor/${input.id}`)
      return updatedBlog
    }
  }

  // Create new blog and publish
  const newBlog: Blog = {
    id: generateId(),
    title: input.title,
    content: input.content,
    tags: input.tags,
    published: true,
    createdAt: now,
    updatedAt: now,
  }

  blogs.push(newBlog)
  console.log('[publishBlog] Created new blog. New blogs count:', blogs.length, blogs.map(b => b.title));
  revalidatePath("/")
  revalidatePath(`/blog/${newBlog.id}`)
  return newBlog
}

// Delete blog
export async function deleteBlog(id: string): Promise<void> {
  blogs = blogs.filter((blog) => blog.id !== id)
  revalidatePath("/")
}
