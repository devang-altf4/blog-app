"use server";

import { connectToDatabase } from "./mongodb";
import type { Blog, BlogInput } from "./types";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";

// Get all blogs
export async function getAllBlogs(status?: "published" | "draft") {
  try {
    const { db } = await connectToDatabase();
    const query = status ? { status } : {};
    const blogs = await db
      .collection("blogs")
      .find(query)
      .sort({ updatedAt: -1 })
      .toArray();

    return JSON.parse(JSON.stringify(blogs)) as Blog[];
  } catch (error) {
    console.error("[getAllBlogs] Failed to fetch blogs:", error);
    return [];
  }
}

// Get a blog by ID
export async function getBlogById(id: string) {
  try {
    const { db } = await connectToDatabase();
    const blog = await db
      .collection("blogs")
      .findOne({ _id: new ObjectId(id) });

    return blog ? (JSON.parse(JSON.stringify(blog)) as Blog) : null;
  } catch (error) {
    console.error(`[getBlogById] Failed to fetch blog with ID ${id}:`, error);
    return null;
  }
}

// Save a blog draft (create or update)
export async function saveDraft(blogData: BlogInput): Promise<Blog> {
  try {
    const { db } = await connectToDatabase();
    const now = new Date();

    const blog = {
      title: blogData.title,
      content: blogData.content,
      tags: blogData.tags,
      status: "draft",
      updatedAt: now,
      published: false,
    };

    let result;
    let createdAt = now;
    let blogId: string;

    if (blogData._id) {
      // Update existing blog
      result = await db.collection("blogs").findOneAndUpdate(
        { _id: new ObjectId(blogData._id) },
        { $set: blog },
        { returnDocument: "after" }
      );
      blogId = blogData._id;
      createdAt = result?.value?.createdAt ?? now;
    } else {
      // Insert new blog
      createdAt = now;
      result = await db.collection("blogs").insertOne({
        ...blog,
        createdAt,
      });
      blogId = result.insertedId.toString();
    }

    revalidatePath("/");

    return {
      _id: blogId,
      title: blog.title,
      content: blog.content,
      tags: blog.tags,
      status: "draft",
      published: false,
      createdAt: createdAt.toISOString(),
      updatedAt: blog.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("[saveDraft] Failed to save draft:", error);
    throw new Error("Failed to save draft");
  }
}

// Publish a blog
export async function publishBlog(blogData: BlogInput) {
  try {
    const { db } = await connectToDatabase();
    const now = new Date();

    if (blogData._id) {
      // Update existing blog to published
      await db.collection("blogs").updateOne(
        { _id: new ObjectId(blogData._id) },
        {
          $set: {
            title: blogData.title,
            content: blogData.content,
            tags: blogData.tags,
            status: "published",
            published: true,
            updatedAt: now,
          },
        }
      );
    } else {
      // Insert as published
      await db.collection("blogs").insertOne({
        title: blogData.title,
        content: blogData.content,
        tags: blogData.tags,
        status: "published",
        published: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[publishBlog] Failed to publish blog:", error);
    return { success: false, error: "Failed to publish blog" };
  }
}

// Delete a blog by ID
export async function deleteBlog(id: string) {
  console.log(`[deleteBlog] Request to delete blog ID: ${id}`);

  if (!id || typeof id !== "string" || !/^[0-9a-fA-F]{24}$/.test(id)) {
    console.error("[deleteBlog] Invalid ID format:", id);
    return { success: false, error: "Invalid blog ID format." };
  }

  try {
    const { db } = await connectToDatabase();
    const objectId = new ObjectId(id);

    const result = await db.collection("blogs").deleteOne({ _id: objectId });

    if (result.deletedCount === 1) {
      console.log(`[deleteBlog] Successfully deleted blog ID: ${id}`);
      revalidatePath("/");
      return { success: true, message: "Blog deleted successfully." };
    } else {
      console.warn(`[deleteBlog] Blog not found or already deleted: ${id}`);
      return { success: false, error: "Blog not found or already deleted." };
    }
  } catch (error) {
    console.error("[deleteBlog] Error deleting blog:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}