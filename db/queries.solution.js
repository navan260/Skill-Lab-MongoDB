// ============================================================================
// db/queries.solution.js
// COMPLETED INSTRUCTOR SOLUTION for CampusConnect Workshop.
// Run `npm run solve-lab` to copy this into db/queries.js at any time.
// ============================================================================

const { ObjectId } = require("mongodb");
const { getDb } = require("./connection");

// Helper: Escapes special regex characters in user search text
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ----------------------------------------------------------------------------
// TASK 1 (DEMO TOGETHER): Get all upcoming events sorted by date ascending
// Route: GET /api/events
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
// TASK 2: Get registrations with optional search & status filter
// Route: GET /api/registrations?event=<search>&status=<status>
// ----------------------------------------------------------------------------
async function getRegistrations({ eventSearch = "", status = "", limit = 50 } = {}) {
  const db = getDb();
  if (!db) return [];

  // Filter object is already built for you based on search bar & dropdown
  const filter = {};
  if (eventSearch) {
    const regex = { $regex: escapeRegex(eventSearch), $options: "i" };
    filter.$or = [{ event: regex }, { studentName: regex }, { email: regex }];
  }
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
// TASK 3: Insert a new student registration document
// Route: POST /api/registrations
// ----------------------------------------------------------------------------
async function insertRegistration(doc) {
  const db = getDb();
  if (!db) return { insertedId: null };

  return await db
    .collection("registrations")
    .insertOne(doc);
}

// ----------------------------------------------------------------------------
// TASK 4: Update a registration's status by its ObjectId
// Route: PATCH /api/registrations/:id/status
// ----------------------------------------------------------------------------
async function updateRegistrationStatus(id, status) {
  const db = getDb();
  if (!db) return { matchedCount: 0, modifiedCount: 0 };

  return await db
    .collection("registrations")
    .updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
    );
}

// ----------------------------------------------------------------------------
// TASK 5: Delete a registration document by its ObjectId
// Route: DELETE /api/registrations/:id
// ----------------------------------------------------------------------------
async function deleteRegistration(id) {
  const db = getDb();
  if (!db) return { deletedCount: 0 };

  return await db
    .collection("registrations")
    .deleteOne({ _id: new ObjectId(id) });
}

// ----------------------------------------------------------------------------
// TASK 6: Aggregate registration counts grouped by event
// Route: GET /api/stats/by-event
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
