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

    console.log("[getAllBlogs] Fetched data from DB:", blogs);

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

// Save a blog draft (create or update)
export async function saveDraft(blogData: {
  id?: string
  title: string
  content: string
  tags: string[]
}): Promise<Blog> {
  try {
    const { db } = await connectToDatabase()
    const now = new Date()
    
    const blog = {
      title: blogData.title,
      content: blogData.content,
      tags: blogData.tags,
      status: "draft",
      updated_at: now,
      published: false
    }

    let result
    
    if (blogData.id) {
      // Update existing blog
      result = await db.collection("blogs").findOneAndUpdate(
        { _id: new ObjectId(blogData.id) },
        { $set: blog },
        { returnDocument: "after" }
      )
      blog._id = blogData.id
    } else {
      // Insert new blog
      blog.created_at = now
      result = await db.collection("blogs").insertOne(blog)
      blog._id = result.insertedId.toString()
    }

    revalidatePath("/")
    return {
      _id: blog._id,
      ...blog
    }
  } catch (error) {
    console.error("Failed to save draft:", error)
    throw new Error("Failed to save draft")
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
        { _id: new ObjectId(blogData._id) },
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

// Delete a blog by ID
export async function deleteBlog(id: string) {
  console.log(`[Server Action - deleteBlog] Received request to delete blog with ID: ${id}`);
  // Basic check for typical ObjectId string length and format. Adjust if your IDs differ.
  if (!id || typeof id !== 'string' || !/^[0-9a-fA-F]{24}$/.test(id)) {
    console.error(`[Server Action - deleteBlog] Invalid ID format received: '${id}'. ID must be a 24-character hex string.`);
    return { success: false, error: "Invalid blog ID format." };
  }

  try {
    const { db } = await connectToDatabase();
    let objectIdToDelete;
    try {
      objectIdToDelete = new ObjectId(id);
      console.log(`[Server Action - deleteBlog] Converted ID '${id}' to ObjectId: '${objectIdToDelete.toHexString()}'`);
    } catch (conversionError) {
      console.error(`[Server Action - deleteBlog] Error converting ID '${id}' to ObjectId:`, conversionError);
      // It's good practice to check the error type if possible, e.g. if (conversionError.name === 'BSONTypeError')
      return { success: false, error: "Failed to process blog ID for deletion due to invalid format." };
    }

    console.log(`[Server Action - deleteBlog] Attempting to delete document with _id: ${objectIdToDelete.toHexString()} from 'blogs' collection.`);
    const result = await db.collection("blogs").deleteOne({ _id: objectIdToDelete });

    console.log('[Server Action - deleteBlog] MongoDB deleteOne operation result:', JSON.stringify(result));

    if (result.deletedCount === 1) {
      console.log(`[Server Action - deleteBlog] Successfully deleted blog with ID: ${id} (ObjectId: ${objectIdToDelete.toHexString()}).`);
      revalidatePath("/"); // Revalidate the main blog list
      // Consider revalidating other relevant paths if necessary, e.g., a dashboard or specific tag pages
      // revalidatePath("/dashboard"); 
      // revalidatePath(`/blog/${id}`); // If you have individual blog pages that need to show 'not found'
      return { success: true, message: "Blog deleted successfully." };
    } else {
      console.warn(`[Server Action - deleteBlog] Blog with ID: ${id} (ObjectId: ${objectIdToDelete.toHexString()}) not found in database, or no document was deleted. Result:`, JSON.stringify(result));
      return { success: false, error: "Blog not found or already deleted." };
    }
  } catch (error) {
    console.error(`[Server Action - deleteBlog] Critical error during deletion process for ID ${id}:`, error);
    if (error instanceof Error) {
        console.error(`[Server Action - deleteBlog] Error Name: ${error.name}, Error Message: ${error.message}, Stack: ${error.stack}`);
    }
    return { success: false, error: "An unexpected error occurred while deleting the blog." };
  }
}