// ============================================================================
// db/queries.solution.js
// COMPLETED REFERENCE IMPLEMENTATION for CampusConnect Workshop.
// Instructors/Presenters can use this during live coding or for verification.
// ============================================================================

const { ObjectId } = require("mongodb");
const { getDb } = require("./connection");

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * 1. Get all events sorted by date ascending.
 */
async function getEvents() {
  const db = getDb();
  if (!db) return [];
  return await db
    .collection("events")
    .find({})
    .sort({ date: 1 })
    .toArray();
}

/**
 * 2. Get registrations with optional case-insensitive event search and limit.
 */
async function getRegistrations({ eventSearch = "", limit = 50 } = {}) {
  const db = getDb();
  if (!db) return [];

  const filter = {};
  if (eventSearch) {
    filter.event = { $regex: escapeRegex(eventSearch), $options: "i" };
  }

  return await db
    .collection("registrations")
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(limit || 50)
    .toArray();
}

/**
 * 3. Insert a single registration document.
 */
async function insertRegistration(doc) {
  const db = getDb();
  if (!db) return { insertedId: null };

  return await db
    .collection("registrations")
    .insertOne(doc);
}

/**
 * 4. Update registration status by ObjectId.
 */
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

/**
 * 5. Delete registration by ObjectId.
 */
async function deleteRegistration(id) {
  const db = getDb();
  if (!db) return { deletedCount: 0 };

  return await db
    .collection("registrations")
    .deleteOne({ _id: new ObjectId(id) });
}

/**
 * 6. Aggregate registration counts grouped by event.
 */
async function getRegistrationCountsByEvent() {
  const db = getDb();
  if (!db) return [];

  const rows = await db
    .collection("registrations")
    .aggregate([
      { $group: { _id: "$event", total: { $sum: 1 } } },
      { $sort: { total: -1 } }
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
