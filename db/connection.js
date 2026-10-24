// ============================================================================
// db/connection.js
// Manages the MongoDB client connection lifecycle.
// ============================================================================

require("dotenv").config();
const { MongoClient } = require("mongodb");

let client = null;
let db = null;

/**
 * Attempts to connect to MongoDB using environment variables.
 * Never logs the raw MONGODB_URI to avoid leaking credentials.
 * If connection fails, logs a friendly warning and allows the server to keep running.
 */
async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || "campusconnect";

  if (!uri) {
    console.warn("MONGODB_URI is not set in .env. MongoDB not reachable, running with placeholder data");
    return null;
  }

  try {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });

    await client.connect();
    // Ping the database to verify the connection is live
    await client.db(dbName).command({ ping: 1 });

    db = client.db(dbName);
    console.log(`[db] Connected to MongoDB database: "${dbName}"`);
    return db;
  } catch (err) {
    console.warn("[db] MongoDB not reachable, running with placeholder data");
    db = null;
    if (client) {
      try {
        await client.close();
      } catch (_) {
        // Ignore cleanup errors
      }
      client = null;
    }
    return null;
  }
}

/**
 * Returns the active database handle, or null if not connected.
 */
function getDb() {
  return db;
}

/**
 * Closes the MongoDB client connection cleanly.
 */
async function closeConnection() {
  if (client) {
    try {
      await client.close();
      console.log("[db] MongoDB connection closed cleanly.");
    } catch (err) {
      console.error("[db] Error while closing MongoDB connection:", err.message);
    } finally {
      client = null;
      db = null;
    }
  }
}

// Close the client cleanly when the process receives SIGINT (Ctrl+C)
process.on("SIGINT", async () => {
  console.log("\n[server] Caught SIGINT. Shutting down gracefully...");
  await closeConnection();
  process.exit(0);
});

module.exports = {
  connectToDatabase,
  getDb,
  closeConnection,
};
