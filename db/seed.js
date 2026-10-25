// ============================================================================
// db/seed.js
// Seeds the MongoDB database with initial sample data for the workshop.
// Run via: npm run seed
// ============================================================================

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.DB_NAME || "campusconnect";

/**
 * Recursively converts MongoDB Extended JSON objects (like {"$date": "..."})
 * into native JavaScript types (like Date objects).
 */
function parseExtendedJson(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(parseExtendedJson);
  }
  if (typeof obj === "object") {
    if (obj.$date) {
      return new Date(obj.$date);
    }
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = parseExtendedJson(value);
    }
    return result;
  }
  return obj;
}

async function seed() {
  console.log(`\n======================================================`);
  console.log(`[seed] Connecting to MongoDB: ${uri}`);
  console.log(`[seed] Target Database: "${dbName}"`);
  console.log(`======================================================`);

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });

  try {
    await client.connect();
    const db = client.db(dbName);
    console.log(`[seed] Connected successfully!\n`);

    // 1. Seed Events Collection
    const eventsPath = path.join(__dirname, "..", "events.json");
    if (fs.existsSync(eventsPath)) {
      const rawEvents = JSON.parse(fs.readFileSync(eventsPath, "utf-8"));
      const eventsData = parseExtendedJson(rawEvents);

      const eventsCollection = db.collection("events");
      await eventsCollection.deleteMany({});
      if (eventsData.length > 0) {
        await eventsCollection.insertMany(eventsData);
        await eventsCollection.createIndex({ date: 1 });
        await eventsCollection.createIndex({ eventId: 1 }, { unique: true });
        console.log(`[seed] ✓ Seeded ${eventsData.length} events into "events" collection`);
        console.log(`[seed] ✓ Created indexes on "events": { date: 1 }, { eventId: 1 } (unique)`);
      }
    } else {
      console.warn(`[seed] ⚠ Warning: events.json not found at ${eventsPath}`);
    }

    // 2. Seed Registrations Collection
    const registrationsPath = path.join(__dirname, "..", "registrations.json");
    if (fs.existsSync(registrationsPath)) {
      const rawRegistrations = JSON.parse(fs.readFileSync(registrationsPath, "utf-8"));
      const registrationsData = parseExtendedJson(rawRegistrations);

      const registrationsCollection = db.collection("registrations");
      await registrationsCollection.deleteMany({});
      if (registrationsData.length > 0) {
        await registrationsCollection.insertMany(registrationsData);

        // Unique compound index: One registration per student email per event
        await registrationsCollection.createIndex({ email: 1, event: 1 }, { unique: true });
        await registrationsCollection.createIndex({ createdAt: -1 });
        await registrationsCollection.createIndex({ event: 1 });
        console.log(`[seed] ✓ Seeded ${registrationsData.length} registrations into "registrations" collection`);
        console.log(`[seed] ✓ Created compound unique index on "registrations": { email: 1, event: 1 }`);
        console.log(`[seed] ✓ Created performance indexes: { createdAt: -1 }, { event: 1 }`);
      }
    } else {
      console.warn(`[seed] ⚠ Warning: registrations.json not found at ${registrationsPath}`);
    }

    console.log(`\n======================================================`);
    console.log(`[seed]  Database successfully seeded and indexed!`);
    console.log(`[seed] Run "npm start" to launch CampusConnect.`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error(`\n[seed] ✗ Failed to seed database:`, err.message);
    console.error(`[seed] Please make sure MongoDB is running locally on port 27017 or update MONGODB_URI in .env`);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
