# CampusConnect: Event Registrations
## MongoDB & Full-Stack Integration — 3-Hour College Skill Lab Workshop

A complete, production-grade full-stack workshop repository designed for conducting a **3-Hour Skill Lab** on **MongoDB and Full-Stack Integration** with Node.js and Express.

```
Browser Form ──(HTTP JSON)──> Express API ──(MongoDB Driver v6)──> MongoDB Database
     ▲                                                                   │
     └─────────────────────────(Live Updates)────────────────────────────┘
```

---

## 🚀 Workshop Materials & Presentation

| Resource | File / Link | Description |
| :--- | :--- | :--- |
| **PowerPoint Presentation (.pptx)** | [**`MongoDB_FullStack_Workshop.pptx`**](./MongoDB_FullStack_Workshop.pptx) | **40-slide light-themed PowerPoint deck** ready for presentation in Microsoft PowerPoint, Google Slides, or Keynote. |
| **Interactive Slide Deck** | [`workshop-presentation.html`](./workshop-presentation.html) | Standalone browser presentation deck with timer, speaker notes (`N`), and fullscreen (`F`). |
| **Speaker Script & Guide** | [`WORKSHOP_SPEAKER_SCRIPT.md`](./WORKSHOP_SPEAKER_SCRIPT.md) | 180-minute dual-presenter playbook with exact minute-by-minute talking points and live demos. |
| **Markdown Slides** | [`slides.md`](./slides.md) | Marp / Slidev / PowerPoint formatted slides for printing or exporting. |
| **Reference Solutions** | [`db/queries.solution.js`](./db/queries.solution.js) | Complete, tested implementation of all 6 workshop queries for instructors. |

---

## 🛠️ Quick Start (4 Steps for Students)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment & Seed Database
Ensure `.env` exists (default points to local MongoDB on port 27017):
```env
MONGODB_URI=mongodb://localhost:27017
DB_NAME=campusconnect
PORT=3000
```

Seed the database with sample events, registrations, and performance indexes:
```bash
npm run seed
```

### 3. Start the Server
```bash
npm run dev
```
*(Runs with `--watch` so any code changes automatically restart the server!)*

### 4. Open the Web Application
Visit **[http://localhost:3000](http://localhost:3000)** in your browser.
- The UI, status indicator, form validation, and live API Activity panel work out of the box!
- Open `db/queries.js` and implement the 6 workshop queries live.

---

## 📂 Project Architecture

```
Skill-Lab-MongoDB/
├── .env                       # Environment variables (Mongo URI, Port)
├── package.json               # Node.js dependencies & scripts
├── server.js                  # Express REST API & input validation
├── events.json                # College event dataset
├── registrations.json         # Student registration dataset
├── db/
│   ├── connection.js          # Resilient MongoClient connection lifecycle
│   ├── seed.js                # Database seeder & index creator (npm run seed)
│   ├── queries.js             # ⭐ Workshop coding workspace (fill in TODOs)
│   └── queries.solution.js    # Instructor reference solutions
├── public/
│   ├── index.html             # Two-column interactive dashboard
│   ├── style.css              # Responsive, modern styling
│   └── app.js                 # Frontend fetch calls & real-time UI rendering
├── workshop-presentation.html # Master 24-slide keynote presentation deck
├── slides.md                  # Marp markdown slide deck
└── WORKSHOP_SPEAKER_SCRIPT.md # Minute-by-minute speaker guide
```

---

## 💻 The 6 Hands-On Workshop Queries (`db/queries.js`)

1. **`getEvents()`**: Fetch all events sorted by date (`find({}).sort({ date: 1 })`).
2. **`getRegistrations({ eventSearch, limit })`**: Query with dynamic case-insensitive regex search and pagination.
3. **`insertRegistration(doc)`**: Insert a student registration into the collection.
4. **`updateRegistrationStatus(id, status)`**: Safe mutation using `new ObjectId(id)` and `$set`.
5. **`deleteRegistration(id)`**: Delete document by `ObjectId`.
6. **`getRegistrationCountsByEvent()`**: Real-time aggregation pipeline using `$group` and `$sort` for live analytics bars.

---

## 💡 Key Architectural Highlights to Show Juniors
- **Graceful Offline Mode**: If MongoDB is not running, the Express server stays up and displays a helpful warning badge instead of crashing.
- **Unique Compound Indexing**: Enforces `{ email: 1, event: 1 }` unique constraint in MongoDB; triggers error code `11000` which Express maps cleanly to `409 Conflict`.
- **Live API Activity Panel**: Real-time logging of HTTP methods, endpoints, status codes, and execution times directly in the UI.
