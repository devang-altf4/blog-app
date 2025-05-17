"use server"

import { connectToDatabase } from "./mongodb"
import type { Blog } from "./types"
import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"

// Get all blogs
export async function getAllBlogs() {
  try {
    const { db } = await connectToDatabase()
    const blogs = await db.collection("blogs").find({}).sort({ updated_at: -1 }).toArray()

    return JSON.parse(JSON.stringify(blogs)) as Blog[]
  } catch (error) {
    console.error("Failed to fetch blogs:", error)
    return []
  }
}

// Get a blog by ID
export async function getBlogById(id: string) {
  try {
    const { db } = await connectToDatabase()
    const blog = await db.collection("blogs").findOne({ _id: new ObjectId(id) })

    if (!blog) return null

    return JSON.parse(JSON.stringify(blog)) as Blog
  } catch (error) {
    console.error(`Failed to fetch blog with ID ${id}`, error)
    return null
  }
}

// Save a blog (create or update)
export async function saveBlog(blogData: Blog) {
  try {
    const { db } = await connectToDatabase()
    const now = new Date()

    if (blogData._id) {
      // Update existing blog
      const result = await db.collection("blogs").updateOne(
        { _id: blogData._id },
        {
          $set: {
            title: blogData.title,
            content: blogData.content,
            tags: blogData.tags,
            status: blogData.status,
            updated_at: now,
          },
        },
      )

      revalidatePath("/")
      revalidatePath(`/editor/${blogData._id}`)
      return { success: true, id: blogData._id }
    } else {
      // Create new blog
      const result = await db.collection("blogs").insertOne({
        title: blogData.title,
        content: blogData.content,
        tags: blogData.tags,
        status: "draft",
        created_at: now,
        updated_at: now,
      })

      revalidatePath("/")
      return { success: true, id: result.insertedId }
    }
  } catch (error) {
    console.error("Failed to save blog:", error)
    return { success: false, error: "Failed to save blog" }
  }
}

// Publish a blog
export async function publishBlog(blogData: Blog) {
  try {
    const { db } = await connectToDatabase()
    const now = new Date()

    if (blogData._id) {
      // Update existing blog
      await db.collection("blogs").updateOne(
        { _id: blogData._id },
        {
          $set: {
            title: blogData.title,
            content: blogData.content,
            tags: blogData.tags,
            status: "published",
            updated_at: now,
          },
        },
      )
    } else {
      // Create new blog as published
      await db.collection("blogs").insertOne({
        title: blogData.title,
        content: blogData.content,
        tags: blogData.tags,
        status: "published",
        created_at: now,
        updated_at: now,
      })
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to publish blog:", error)
    return { success: false, error: "Failed to publish blog" }
  }
}