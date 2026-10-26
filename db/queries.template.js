// ============================================================================
// db/queries.template.js — BACKUP OF STUDENT STARTER TEMPLATE
// Run `npm run reset-lab` to restore db/queries.js to this starter template.
// ============================================================================

const { ObjectId } = require("mongodb");
const { getDb } = require("./connection");

// Helper: Escapes special regex characters in user search text
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ----------------------------------------------------------------------------
// TASK 1 (DONE TOGETHER): Get all upcoming events sorted by date ascending
// Route: GET /api/events
// ----------------------------------------------------------------------------
async function getEvents() {
  const db = getDb();
  if (!db) return [];

  // Step 1 Example (Completed): Fetch all events sorted by date (ascending: 1)
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
async function getRegistrations({ eventSearch = "", status = "", limit = 1000 } = {}) {
  const db = getDb();
  if (!db) return [];

  // The filter object is already built for you based on the UI search & filter:
  const filter = {};
  if (eventSearch) {
    const regex = { $regex: escapeRegex(eventSearch), $options: "i" };
    filter.$or = [{ event: regex }, { studentName: regex }, { email: regex }];
  }
  if (status) {
    filter.status = status.toLowerCase();
  }

  // TODO (Task 2): Query the "registrations" collection:
  //   1. Pass `filter` into .find(filter)
  //   2. Sort newest first using .sort({ createdAt: -1 })
  //   3. Convert cursor to array using .toArray()
  return [];
}

// ----------------------------------------------------------------------------
// TASK 3: Insert a new student registration document
// Route: POST /api/registrations
// ----------------------------------------------------------------------------
async function insertRegistration(doc) {
  const db = getDb();
  if (!db) return { insertedId: null };

  // TODO (Task 3): Insert `doc` into the "registrations" collection
  // Hint: return await db.collection("registrations").insertOne(doc);
  return { insertedId: null };
}

// ----------------------------------------------------------------------------
// TASK 4: Update a registration's status by its ObjectId
// Route: PATCH /api/registrations/:id/status
// ----------------------------------------------------------------------------
async function updateRegistrationStatus(id, status) {
  const db = getDb();
  if (!db) return { matchedCount: 0, modifiedCount: 0 };

  // TODO (Task 4): Update the document in "registrations" using .updateOne()
  //   Filter: { _id: new ObjectId(id) }
  //   Update: { $set: { status } }
  return { matchedCount: 0, modifiedCount: 0 };
}

// ----------------------------------------------------------------------------
// TASK 5: Delete a registration document by its ObjectId
// Route: DELETE /api/registrations/:id
// ----------------------------------------------------------------------------
async function deleteRegistration(id) {
  const db = getDb();
  if (!db) return { deletedCount: 0 };

  // TODO (Task 5): Delete the document in "registrations" using .deleteOne()
  //   Filter: { _id: new ObjectId(id) }
  return { deletedCount: 0 };
}

// ----------------------------------------------------------------------------
// TASK 6: Aggregate registration counts grouped by event
// Route: GET /api/stats/by-event
// ----------------------------------------------------------------------------
async function getRegistrationCountsByEvent() {
  const db = getDb();
  if (!db) return [];

  // TODO (Task 6): Replace `const rows = [];` with an aggregation pipeline on "registrations":
  //   Stage 1: { $group: { _id: "$event", total: { $sum: 1 } } }
  //   Stage 2: { $sort: { total: -1 } }
  //   Don't forget .toArray() at the end!
  const rows = [];

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
