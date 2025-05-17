import { MongoClient } from "mongodb"

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MongoDB URI to .env.local")
}

const MONGODB_URI = process.env.MONGODB_URI

// Extract database name from connection string or use default
function getDatabaseName(uri: string): string {
  try {
    // Try to extract database name from the URI
    const dbName = uri.split("/").pop()?.split("?")[0]
    if (dbName && dbName !== "") {
      return dbName
    }
  } catch (error) {
    console.warn("Could not extract database name from URI, using default")
  }

  // Default database name
  return "blog-app"
}

const MONGODB_DB = getDatabaseName(MONGODB_URI)

// Connection cache
let cachedClient: MongoClient | null = null
let cachedDb: any = null

export async function connectToDatabase() {
  // If we have a cached connection, use it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  // Create a new connection with options
  const client = new MongoClient(MONGODB_URI, {
    connectTimeoutMS: 10000, // 10 seconds
    socketTimeoutMS: 45000,  // 45 seconds
  })
  
  try {
    await client.connect()
    const db = client.db(MONGODB_DB)
    
    // Verify connection
    await db.command({ ping: 1 })
    console.log("Successfully connected to MongoDB.")
    
    return { client, db }
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error)
    throw error
  }

  // Cache the connection
  cachedClient = client
  cachedDb = db

  return { client, db }
}