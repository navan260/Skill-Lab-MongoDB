// ============================================================================
// server.js
// Express application and API routes.
// Routes only call functions from db/queries.js — never the MongoDB driver directly.
// ============================================================================

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const { connectToDatabase, getDb } = require("./db/connection");
const queries = require("./db/queries");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// 1. GET /api/health — Check server and database connection status
app.get("/api/health", (req, res) => {
  const db = getDb();
  res.json({
    ok: true,
    database: db ? "connected" : "not connected",
  });
});

// 2. GET /api/events — Fetch events for dropdown
app.get("/api/events", async (req, res) => {
  try {
    const events = await queries.getEvents();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// 3. GET /api/registrations?event=<text> — Fetch registrations
app.get("/api/registrations", async (req, res) => {
  try {
    const eventSearch = (req.query.event || "").trim();
    const registrations = await queries.getRegistrations({ eventSearch, limit: 50 });
    res.json(registrations);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch registrations" });
  }
});

// 4. POST /api/registrations — Insert a new registration document
app.post("/api/registrations", async (req, res) => {
  try {
    const { studentName, email, event, year, city, interests, dietaryNeeds } = req.body;

    if (!studentName || !email || !event) {
      return res.status(400).json({ error: "Student name, email, and event are required" });
    }

    const parsedInterests =
      typeof interests === "string"
        ? interests.split(",").map((s) => s.trim()).filter(Boolean)
        : Array.isArray(interests)
        ? interests
        : [];

    const doc = {
      studentName: studentName.trim(),
      email: email.trim().toLowerCase(),
      event: event.trim(),
      ...(year ? { year: Number(year) } : {}),
      ...(city ? { city: city.trim() } : {}),
      interests: parsedInterests,
      dietaryNeeds: { vegetarian: Boolean(dietaryNeeds?.vegetarian) },
      status: "pending",
      registered: true,
      feePaid: 0,
      createdAt: new Date(),
    };

    const result = await queries.insertRegistration(doc);
    res.status(201).json({ id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: "Failed to create registration" });
  }
});

// 5. PATCH /api/registrations/:id/status — Update registration status
app.patch("/api/registrations/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await queries.updateRegistrationStatus(id, status);
    if (!result || result.matchedCount === 0) {
      return res.status(404).json({ error: "Registration not found" });
    }

    res.json({ id, status, modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

// 6. DELETE /api/registrations/:id — Delete a registration
app.delete("/api/registrations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await queries.deleteRegistration(id);

    if (!result || result.deletedCount === 0) {
      return res.status(404).json({ error: "Registration not found" });
    }

    res.json({ id, deleted: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete registration" });
  }
});

// 7. GET /api/stats/by-event — Aggregation count per event
app.get("/api/stats/by-event", async (req, res) => {
  try {
    const stats = await queries.getRegistrationCountsByEvent();
    res.json(stats);
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
