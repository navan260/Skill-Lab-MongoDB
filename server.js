// ============================================================================
// server.js
// Express Backend API for CampusConnect: Event Registrations.
// Routes validate incoming HTTP requests and call functions in db/queries.js.
// ============================================================================

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const { connectToDatabase, getDb } = require("./db/connection");

const app = express();
const PORT = process.env.PORT || 3000;

// Hot-reload db/queries.js on every request so saving db/queries.js works immediately
function getQueries() {
  const queriesPath = require.resolve("./db/queries");
  delete require.cache[queriesPath];
  return require(queriesPath);
}

// Middleware: Parse JSON request bodies & serve frontend files from public/
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const ALLOWED_STATUSES = ["pending", "confirmed", "waitlisted", "cancelled"];
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

// ----------------------------------------------------------------------------
// 1. GET /api/health — Database connection status
// ----------------------------------------------------------------------------
app.get("/api/health", (req, res) => {
  const db = getDb();
  res.json({
    ok: true,
    database: db ? "connected" : "not connected",
    dbName: process.env.DB_NAME || "campusconnect",
  });
});

// ----------------------------------------------------------------------------
// 2. GET /api/events — List all upcoming college events
// ----------------------------------------------------------------------------
app.get("/api/events", async (req, res) => {
  try {
    const events = await getQueries().getEvents();
    res.json(Array.isArray(events) ? events : []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// ----------------------------------------------------------------------------
// 3. GET /api/registrations?event=<search>&status=<status> — List registrations
// ----------------------------------------------------------------------------
app.get("/api/registrations", async (req, res) => {
  try {
    const eventSearch = (req.query.event || "").trim();
    const status = (req.query.status || "").trim();
    const limit = Number(req.query.limit) || 1000;

    const registrations = await getQueries().getRegistrations({
      eventSearch,
      status,
      limit,
    });

    const list = Array.isArray(registrations) ? registrations : [];
    // Ensure newest registrations appear at the very top even if student omitted .sort({ createdAt: -1 })
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch registrations" });
  }
});

// ----------------------------------------------------------------------------
// 4. POST /api/registrations — Create a new student registration
// ----------------------------------------------------------------------------
app.post("/api/registrations", async (req, res) => {
  try {
    const {
      studentName,
      email,
      event,
      eventId,
      year,
      department,
      city,
      interests,
      dietaryNeeds,
    } = req.body || {};

    if (!studentName || !email || !event) {
      return res.status(400).json({
        error: "Student name, email, and event are required",
      });
    }

    const parsedInterests =
      typeof interests === "string"
        ? interests
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : Array.isArray(interests)
        ? interests
        : [];

    const doc = {
      studentName: studentName.trim(),
      email: email.trim().toLowerCase(),
      event: event.trim(),
      ...(eventId ? { eventId: String(eventId).trim() } : {}),
      ...(year ? { year: Number(year) } : {}),
      ...(department ? { department: String(department).trim() } : {}),
      ...(city ? { city: city.trim() } : {}),
      interests: parsedInterests,
      dietaryNeeds: { vegetarian: Boolean(dietaryNeeds?.vegetarian) },
      status: "pending",
      registered: true,
      feePaid: 0,
      createdAt: new Date(),
    };

    const result = await getQueries().insertRegistration(doc);
    if (!result || !result.insertedId) {
      return res.status(501).json({
        error: "insertRegistration() in db/queries.js did not insert the document. Check your Task 3 code.",
      });
    }

    return res.status(201).json({ id: result.insertedId, document: doc });
  } catch (err) {
    // Handle MongoDB unique index violation (same email + event)
    if (err && err.code === 11000) {
      return res.status(409).json({
        error: "Already registered: This email is already signed up for this event",
      });
    }
    return res.status(500).json({ error: "Failed to create registration" });
  }
});

// ----------------------------------------------------------------------------
// 5. PATCH /api/registrations/:id/status — Update registration status
// ----------------------------------------------------------------------------
app.patch("/api/registrations/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const status = (req.body?.status || "").trim().toLowerCase();

    if (!OBJECT_ID_REGEX.test(id)) {
      return res.status(400).json({ error: "Invalid ObjectId format" });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Status must be one of: ${ALLOWED_STATUSES.join(", ")}`,
      });
    }

    const result = await getQueries().updateRegistrationStatus(id, status);
    if (!result || result.matchedCount === 0) {
      return res.status(404).json({ error: "Registration not found (or Task 4 not implemented yet)" });
    }

    return res.json({ id, status, modifiedCount: result.modifiedCount });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update status" });
  }
});

// ----------------------------------------------------------------------------
// 6. DELETE /api/registrations/:id — Delete a registration
// ----------------------------------------------------------------------------
app.delete("/api/registrations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!OBJECT_ID_REGEX.test(id)) {
      return res.status(400).json({ error: "Invalid ObjectId format" });
    }

    const result = await getQueries().deleteRegistration(id);
    if (!result || result.deletedCount === 0) {
      return res.status(404).json({ error: "Registration not found (or Task 5 not implemented yet)" });
    }

    return res.json({ id, deleted: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete registration" });
  }
});

// ----------------------------------------------------------------------------
// 7. GET /api/stats/by-event — Aggregation count per event
// ----------------------------------------------------------------------------
app.get("/api/stats/by-event", async (req, res) => {
  try {
    const stats = await getQueries().getRegistrationCountsByEvent();
    res.json(Array.isArray(stats) ? stats : []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Start Server
async function startServer() {
  await connectToDatabase();
  app.listen(PORT, () => {
    console.log(`[server] CampusConnect running at http://localhost:${PORT}`);
  });
}

startServer();
