# CampusConnect — College Event Registration Portal
## RVCE Skill Lab: MongoDB & Full-Stack Integration

A clean, minimal full-stack event registration portal built with **Node.js, Express, and MongoDB Native Driver (v6)** for the RVCE Skill Lab workshop.

```
Browser UI (public/) ──(HTTP JSON)──> Express REST API (server.js) ──(MongoDB Driver)──> MongoDB (db/queries.js)
```

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Seed sample events & registrations into MongoDB
npm run seed

# 3. Start the server (auto-reloads when you edit db/queries.js)
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## Workshop Materials

| File | Purpose |
| :--- | :--- |
| **[`db/queries.js`](./db/queries.js)** | **Student Workspace:** Task 1 (`getEvents`) is done as a live example; Tasks 2–6 have boilerplate written and `TODO` blocks for the MongoDB queries. |
| **[`db/queries.solution.js`](./db/queries.solution.js)** | **Solution** with all 6 MongoDB functions completed. |
| **[`MongoDB_FullStack_Workshop.pptx`](./MongoDB_FullStack_Workshop.pptx)** | **PowerPoint Presentation** covering Foundations, Setup, Querying, Aggregation, and Full-Stack Integration. |

---

