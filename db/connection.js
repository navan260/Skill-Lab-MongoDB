// ============================================================================
// db/connection.js
// Manages the MongoDB client connection lifecycle and auto-seeds initial data
// if the target database collections are empty.
// ============================================================================

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { MongoClient } = require("mongodb");

let client = null;
let db = null;

function parseExtendedJson(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(parseExtendedJson);
  if (typeof obj === "object") {
    if (obj.$date) return new Date(obj.$date);
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = parseExtendedJson(value);
    }
    return result;
  }
  return obj;
}

async function ensureSeedData(database) {
  try {
    const eventsColl = database.collection("events");
    const regsColl = database.collection("registrations");

    const eventsCount = await eventsColl.countDocuments();
    if (eventsCount === 0) {
      const eventsPath = path.join(__dirname, "..", "events.json");
      if (fs.existsSync(eventsPath)) {
        const eventsData = parseExtendedJson(JSON.parse(fs.readFileSync(eventsPath, "utf-8")));
        if (eventsData.length > 0) {
          await eventsColl.insertMany(eventsData);
          await eventsColl.createIndex({ date: 1 });
          await eventsColl.createIndex({ eventId: 1 }, { unique: true });
          console.log(`[db] Auto-seeded ${eventsData.length} events into "events" collection.`);
        }
      }
    }

    const regsCount = await regsColl.countDocuments();
    if (regsCount === 0) {
      const regsPath = path.join(__dirname, "..", "registrations.json");
      if (fs.existsSync(regsPath)) {
        const regsData = parseExtendedJson(JSON.parse(fs.readFileSync(regsPath, "utf-8")));
        if (regsData.length > 0) {
          await regsColl.insertMany(regsData);
          await regsColl.createIndex({ email: 1, event: 1 }, { unique: true });
          await regsColl.createIndex({ createdAt: -1 });
          await regsColl.createIndex({ event: 1 });
          console.log(`[db] Auto-seeded ${regsData.length} registrations into "registrations" collection.`);
        }
      }
    }
  } catch (err) {
    console.warn("[db] Auto-seed check warning:", err.message);
  }
}

/**
 * Attempts to connect to MongoDB using environment variables.
 */
async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || "campusconnect";

  if (!uri) {
    console.warn("MONGODB_URI is not set in .env. MongoDB not reachable.");
    return null;
  }

  try {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });

    await client.connect();
    await client.db(dbName).command({ ping: 1 });

    db = client.db(dbName);
    console.log(`[db] Connected to MongoDB database: "${dbName}"`);

    // Ensure sample events and registrations are present
    await ensureSeedData(db);

    return db;
  } catch (err) {
    console.warn("[db] MongoDB not reachable:", err.message);
    db = null;
    if (client) {
      try {
        await client.close();
      } catch (_) {}
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
