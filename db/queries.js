// ============================================================================
// db/queries.js
// ALL database commands live in this file!
//
// Right now, each function is a placeholder that returns empty data so the
// website and Express API can run before we write our MongoDB queries live
// during the workshop.
//
// Collections used:
//   - "events"
//   - "registrations"
// ============================================================================

const { ObjectId } = require("mongodb");
const { getDb } = require("./connection");

// Helper for escaping user search input before building a RegExp
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ----------------------------------------------------------------------------
// 1. Get all events (sorted by date ascending)
// ----------------------------------------------------------------------------
/**
 * TODO (Workshop Step 1): Fetch all upcoming events sorted by date.
 *
 * Equivalent MongoDB driver call:
 *   const db = getDb();
 *   if (!db) return [];
 *   return await db
 *     .collection("events")
 *     .find({})
 *     .sort({ date: 1 })
 *     .toArray();
 */
async function getEvents() {
  console.log("[queries] placeholder: getEvents");
  return [];
}

// ----------------------------------------------------------------------------
// 2. Get registrations (with optional case-insensitive event search & limit)
// ----------------------------------------------------------------------------
/**
 * TODO (Workshop Step 2): Fetch registrations, optionally filtered by event name.
 *
 * Equivalent MongoDB driver call:
 *   const db = getDb();
 *   if (!db) return [];
 *   const filter = {};
 *   if (eventSearch) {
 *     filter.event = { $regex: escapeRegex(eventSearch), $options: "i" };
 *   }
 *   return await db
 *     .collection("registrations")
 *     .find(filter)
 *     .sort({ createdAt: -1 })
 *     .limit(limit || 50)
 *     .toArray();
 */
async function getRegistrations({ eventSearch = "", limit = 50 } = {}) {
  console.log("[queries] placeholder: getRegistrations");
  return [];
}

// ----------------------------------------------------------------------------
// 3. Insert a new registration document
// ----------------------------------------------------------------------------
/**
 * TODO (Workshop Step 3): Insert a single registration document into "registrations".
 *
 * Equivalent MongoDB driver call:
 *   const db = getDb();
 *   if (!db) return { insertedId: null };
 *   return await db
 *     .collection("registrations")
 *     .insertOne(doc);
 */
async function insertRegistration(doc) {
  console.log("[queries] placeholder: insertRegistration");
  return { insertedId: null };
}

// ----------------------------------------------------------------------------
// 4. Update a registration's status by _id
// ----------------------------------------------------------------------------
/**
 * TODO (Workshop Step 4): Update the `status` field of a registration by its ObjectId.
 *
 * Equivalent MongoDB driver call:
 *   const db = getDb();
 *   if (!db) return { matchedCount: 0, modifiedCount: 0 };
 *   return await db
 *     .collection("registrations")
 *     .updateOne(
 *       { _id: new ObjectId(id) },
 *       { $set: { status } }
 *     );
 */
async function updateRegistrationStatus(id, status) {
  console.log("[queries] placeholder: updateRegistrationStatus");
  return { matchedCount: 0, modifiedCount: 0 };
}

// ----------------------------------------------------------------------------
// 5. Delete a registration by _id
// ----------------------------------------------------------------------------
/**
 * TODO (Workshop Step 5): Delete a single registration document by its ObjectId.
 *
 * Equivalent MongoDB driver call:
 *   const db = getDb();
 *   if (!db) return { deletedCount: 0 };
 *   return await db
 *     .collection("registrations")
 *     .deleteOne({ _id: new ObjectId(id) });
 */
async function deleteRegistration(id) {
  console.log("[queries] placeholder: deleteRegistration");
  return { deletedCount: 0 };
}

// ----------------------------------------------------------------------------
// 6. Aggregate registration counts grouped by event
// ----------------------------------------------------------------------------
/**
 * TODO (Workshop Step 6): Run an aggregation pipeline to count registrations per event.
 *
 * Equivalent MongoDB driver call:
 *   const db = getDb();
 *   if (!db) return [];
 *   const rows = await db
 *     .collection("registrations")
 *     .aggregate([
 *       { $group: { _id: "$event", total: { $sum: 1 } } },
 *       { $sort: { total: -1 } }
 *     ])
 *     .toArray();
 *   return rows.map((r) => ({ event: r._id, total: r.total }));
 */
async function getRegistrationCountsByEvent() {
  console.log("[queries] placeholder: getRegistrationCountsByEvent");
  return [];
}

module.exports = {
  getEvents,
  getRegistrations,
  insertRegistration,
  updateRegistrationStatus,
  deleteRegistration,
  getRegistrationCountsByEvent,
};
