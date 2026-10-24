// ============================================================================
// server.js
// Express application, API routes, and input validation.
// Routes only call functions from db/queries.js — never the MongoDB driver directly.
// ============================================================================

require("dotenv").config();
const path = require("path");
const express = require("express");
const { connectToDatabase, getDb } = require("./db/connection");
const queries = require("./db/queries");

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON request bodies and serve static frontend files from public/
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ----------------------------------------------------------------------------
// Validation Helpers
// ----------------------------------------------------------------------------
const HEX_24_REGEX = /^[0-9a-fA-F]{24}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_STATUSES = ["pending", "confirmed", "waitlisted", "cancelled"];

function isValidObjectIdString(id) {
  return typeof id === "string" && HEX_24_REGEX.test(id);
}

function cleanString(val) {
  return typeof val === "string" ? val.trim() : "";
}

// ----------------------------------------------------------------------------
// API Routes
// ----------------------------------------------------------------------------

/**
 * GET /api/health
 * Returns server and database connection status.
 */
app.get("/api/health", async (req, res) => {
  try {
    const db = getDb();
    res.json({
      ok: true,
      database: db ? "connected" : "not connected",
    });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

/**
 * GET /api/events
 * Returns the list of events for the registration dropdown.
 */
app.get("/api/events", async (req, res) => {
  try {
    const events = await queries.getEvents();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

/**
 * GET /api/registrations?event=<text>
 * Lists registrations, optionally filtered by partial event name.
 */
app.get("/api/registrations", async (req, res) => {
  try {
    const eventSearch = cleanString(req.query.event || "");
    const registrations = await queries.getRegistrations({
      eventSearch,
      limit: 50,
    });
    res.json(registrations);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

/**
 * POST /api/registrations
 * Validates input, constructs the registration document, and inserts it.
 */
app.post("/api/registrations", async (req, res) => {
  try {
    const body = req.body || {};

    const studentName = cleanString(body.studentName);
    const email = cleanString(body.email).toLowerCase();
    const event = cleanString(body.event);
    const eventId = cleanString(body.eventId);
    const city = cleanString(body.city);

    // 1. Check required fields
    if (!studentName || !email || !event) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    // 2. Validate email format
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "Please provide a valid email address" });
    }

    // 3. Validate optional year (must be an integer 1 to 4 if provided)
    let parsedYear;
    if (body.year !== undefined && body.year !== null && String(body.year).trim() !== "") {
      const numYear = Number(body.year);
      if (!Number.isInteger(numYear) || numYear < 1 || numYear > 4) {
        return res.status(400).json({ error: "Year must be an integer between 1 and 4" });
      }
      parsedYear = numYear;
    }

    // 4. Parse interests (accepts array of strings or comma-separated string)
    let interests = [];
    if (Array.isArray(body.interests)) {
      interests = body.interests.map((item) => cleanString(String(item))).filter(Boolean);
    } else if (typeof body.interests === "string" && body.interests.trim() !== "") {
      interests = body.interests
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    // 5. Parse dietaryNeeds.vegetarian boolean
    const vegetarian = Boolean(
      body.dietaryNeeds && typeof body.dietaryNeeds === "object"
        ? body.dietaryNeeds.vegetarian
        : body.vegetarian
    );

    // 6. Build the document matching the sample schema
    const doc = {
      studentName,
      email,
      event,
      ...(eventId ? { eventId } : {}),
      ...(parsedYear !== undefined ? { year: parsedYear } : {}),
      ...(city ? { city } : {}),
      interests,
      dietaryNeeds: {
        vegetarian,
      },
      status: "pending",
      registered: true,
      feePaid: 0,
      createdAt: new Date(),
    };

    const result = await queries.insertRegistration(doc);
    return res.status(201).json({ id: result.insertedId });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ error: "Already registered for this event" });
    }
    return res.status(500).json({ error: "Something went wrong" });
  }
});

/**
 * PATCH /api/registrations/:id/status
 * Updates the status of an existing registration.
 */
app.patch("/api/registrations/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectIdString(id)) {
      return res.status(400).json({ error: "Invalid registration ID format" });
    }

    const status = cleanString(req.body && req.body.status);
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        error: "Status must be one of: pending, confirmed, waitlisted, cancelled",
      });
    }

    const result = await queries.updateRegistrationStatus(id, status);
    if (!result || result.matchedCount === 0) {
      return res.status(404).json({ error: "Registration not found" });
    }

    return res.json({
      id,
      status,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong" });
  }
});

/**
 * DELETE /api/registrations/:id
 * Deletes a registration by ID.
 */
app.delete("/api/registrations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectIdString(id)) {
      return res.status(400).json({ error: "Invalid registration ID format" });
    }

    const result = await queries.deleteRegistration(id);
    if (!result || result.deletedCount === 0) {
      return res.status(404).json({ error: "Registration not found" });
    }

    return res.json({ id, deleted: true });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong" });
  }
});

/**
 * GET /api/stats/by-event
 * Returns aggregated counts of registrations per event.
 */
app.get("/api/stats/by-event", async (req, res) => {
  try {
    const stats = await queries.getRegistrationCountsByEvent();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ----------------------------------------------------------------------------
// Server Startup
// ----------------------------------------------------------------------------
async function startServer() {
  await connectToDatabase();

  app.listen(PORT, () => {
    console.log(`[server] CampusConnect running at http://localhost:${PORT}`);
  });
}

startServer();
