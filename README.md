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
| **[`STUDENT_MANUAL.md`](./STUDENT_MANUAL.md)** | **Step-by-step Student Hands-On Manual** with instructions and code hints for completing `db/queries.js`. |
| **[`db/queries.js`](./db/queries.js)** | **Student Workspace:** Task 1 (`getEvents`) is done as a live example; Tasks 2–6 have boilerplate written and `TODO` blocks for the MongoDB queries. |
| **[`db/queries.solution.js`](./db/queries.solution.js)** | **Instructor Reference Solution** with all 6 MongoDB functions completed. |
| **[`MongoDB_FullStack_Workshop.pptx`](./MongoDB_FullStack_Workshop.pptx)** | **40-Slide PowerPoint Presentation** covering Foundations, Setup, Querying, Aggregation, and Full-Stack Integration. |

---

## Instructor Helper Commands

Want to switch between the **Student Starter Template** (only Task 1 implemented) and the **Full Working Solution** (all 6 tasks implemented) during your demo?

```bash
# Switch db/queries.js to the FULL WORKING SOLUTION (all 6 queries working):
npm run solve-lab

# Reset db/queries.js back to the STUDENT STARTER TEMPLATE (Task 1 done, Tasks 2-6 TODO):
npm run reset-lab
```
*(Because `npm run dev` runs with `--watch`, the server will automatically reload the moment you run either command!)*
