// ============================================================================
// db/queries.js
// All MongoDB database operations for CampusConnect live in this file.
// Express routes in server.js call these 6 functions.
//
// Collections used:
//   1. "events"         — College events list
//   2. "registrations"  — Student event signups
// ============================================================================

const { ObjectId } = require("mongodb");
const { getDb } = require("./connection");

// Helper: Escapes special regex characters in user search text
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ----------------------------------------------------------------------------
// 1. READ EVENTS: Get all upcoming events sorted by date ascending
//    Route: GET /api/events
// ----------------------------------------------------------------------------
async function getEvents() {
  const db = getDb();
  if (!db) return [];

  return await db
    .collection("events")
    .find({})
    .sort({ date: 1 })
    .toArray();
}

// ----------------------------------------------------------------------------
// 2. READ REGISTRATIONS: Get registrations with optional search & status filter
//    Route: GET /api/registrations?event=<search>&status=<status>
// ----------------------------------------------------------------------------
async function getRegistrations({ eventSearch = "", status = "", limit = 50 } = {}) {
  const db = getDb();
  if (!db) return [];

  const filter = {};

  // Case-insensitive partial match on event name or student name
  if (eventSearch) {
    const regex = { $regex: escapeRegex(eventSearch), $options: "i" };
    filter.$or = [{ event: regex }, { studentName: regex }, { email: regex }];
  }

  // Optional exact filter by status (pending, confirmed, waitlisted, cancelled)
  if (status) {
    filter.status = status.toLowerCase();
  }

  return await db
    .collection("registrations")
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(limit || 50)
    .toArray();
}

// ----------------------------------------------------------------------------
// 3. CREATE REGISTRATION: Insert a new student registration document
//    Route: POST /api/registrations
// ----------------------------------------------------------------------------
async function insertRegistration(doc) {
  const db = getDb();
  if (!db) return { insertedId: null };

  return await db
    .collection("registrations")
    .insertOne(doc);
}

// ----------------------------------------------------------------------------
// 4. UPDATE STATUS: Update a registration's status by its ObjectId
//    Route: PATCH /api/registrations/:id/status
// ----------------------------------------------------------------------------
async function updateRegistrationStatus(id, status) {
  const db = getDb();
  if (!db) return { matchedCount: 0, modifiedCount: 0 };

  return await db
    .collection("registrations")
    .updateOne(
      { _id: new ObjectId(id) }, // Convert URL string ID to MongoDB ObjectId
      { $set: { status } }       // $set updates only the status field
    );
}

// ----------------------------------------------------------------------------
// 5. DELETE REGISTRATION: Remove a registration document by its ObjectId
//    Route: DELETE /api/registrations/:id
// ----------------------------------------------------------------------------
async function deleteRegistration(id) {
  const db = getDb();
  if (!db) return { deletedCount: 0 };

  return await db
    .collection("registrations")
    .deleteOne({ _id: new ObjectId(id) });
}

// ----------------------------------------------------------------------------
// 6. AGGREGATE ANALYTICS: Count registrations grouped by event
//    Route: GET /api/stats/by-event
// ----------------------------------------------------------------------------
async function getRegistrationCountsByEvent() {
  const db = getDb();
  if (!db) return [];

  const rows = await db
    .collection("registrations")
    .aggregate([
      { $group: { _id: "$event", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ])
    .toArray();

  return rows.map((r) => ({ event: r._id, total: r.total }));
}

module.exports = {
  getEvents,
  getRegistrations,
  insertRegistration,
  updateRegistrationStatus,
  deleteRegistration,
  getRegistrationCountsByEvent,
};
