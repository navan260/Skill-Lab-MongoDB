# CampusConnect — Student Hands-On Lab Manual
**RVCE Skill Lab: MongoDB & Full-Stack Integration**

In this hands-on lab, the frontend (`public/`) and Express backend routes (`server.js`) are already wired up for you. Your task is to write the **MongoDB database queries** inside **[`db/queries.js`](./db/queries.js)** to power the entire portal!

---

## Step 1: Project Setup (Run Once)

Open your terminal inside the project folder and run:

```bash
# 1. Install Node.js packages
npm install

# 2. Seed local MongoDB with 8 events and 300 student registrations
npm run seed

# 3. Start the server in auto-reload mode
npm run dev
```

Now open **[http://localhost:3000](http://localhost:3000)** in your browser.
- Because **Task 1 (`getEvents`)** is already implemented as an example, you will immediately see the **8 Upcoming College Events** and the **Event Dropdown** working!
- However, the **Registrations Table**, **New Registration Form**, **Status Update/Delete**, and **Summary Table** won't work yet until you complete Tasks 2–6 in `db/queries.js`.

---

## Step 2: Open `db/queries.js`

Open **`db/queries.js`** in VS Code. Notice that **all the JavaScript boilerplate (`getDb()`, search filter construction, etc.) is already written for you**. You only need to write the MongoDB query inside each function!

---

### Task 1: Fetch Upcoming Events *(Already Done as Reference Example)*
Look at `getEvents()` in `db/queries.js` to see how a MongoDB query works in Node.js:

```javascript
async function getEvents() {
  const db = getDb();
  if (!db) return [];

  return await db
    .collection("events")
    .find({})
    .sort({ date: 1 })
    .toArray();
}
```
- `db.collection("events")` selects the `events` collection.
- `.find({})` matches all documents.
- `.sort({ date: 1 })` sorts by date in ascending order (`1` = ascending, `-1` = descending).
- `.toArray()` executes the query cursor and returns a JavaScript array.

---

### Task 2: Fetch & Search Registrations (`getRegistrations`)
**Goal:** Load student registrations into the table, sorted by newest first (`createdAt: -1`), using the `filter` object that is already created above the `TODO`.

**What to replace `return [];` with:**
```javascript
  return await db
    .collection("registrations")
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(limit || 50)
    .toArray();
```
**Test it:** Save `db/queries.js` and refresh **[http://localhost:3000](http://localhost:3000)**. You should now see the **Student Registrations** table populated with records, and the search bar + status dropdown filter will work!

---

### Task 3: Register a Student (`insertRegistration`)
**Goal:** When a user submits the "New Registration" form on the left, Express validates the data and passes `doc` into `insertRegistration(doc)`. Save `doc` into the `"registrations"` collection.

**What to replace `return { insertedId: null };` with:**
```javascript
  return await db
    .collection("registrations")
    .insertOne(doc);
```
**Test it:** Fill out the **New Registration** form on the website and click **Register Student**.
- Try registering the **same email for the same event twice**—MongoDB's unique compound index (`{ email: 1, event: 1 }`) will automatically block the duplicate!

---

### Task 4: Update Registration Status (`updateRegistrationStatus`)
**Goal:** When you change a student's status dropdown (`pending` / `confirmed` / `waitlisted` / `cancelled`) in the table, update that specific document by its `_id`.
- Remember: `id` comes from the URL as a plain string, so wrap it in `new ObjectId(id)`.
- Use the `$set` operator so you only update the `status` field without overwriting the rest of the document.

**What to replace `return { matchedCount: 0, modifiedCount: 0 };` with:**
```javascript
  return await db
    .collection("registrations")
    .updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
    );
```
**Test it:** Change any student's status dropdown in the table and watch the status badge update!

---

### Task 5: Delete a Registration (`deleteRegistration`)
**Goal:** When you click the **Delete** button on a row, remove that document from `"registrations"` using its `_id`.

**What to replace `return { deletedCount: 0 };` with:**
```javascript
  return await db
    .collection("registrations")
    .deleteOne({ _id: new ObjectId(id) });
```
**Test it:** Click **Delete** on any registration row in the table and verify it is removed.

---

### Task 6: Registration Summary by Event (`getRegistrationCountsByEvent`)
**Goal:** Populate the **Registration Summary by Event** table at the bottom of the page using a MongoDB **Aggregation Pipeline** (`.aggregate([...])`).
- **Stage 1 (`$group`):** Group documents by `"$event"` and count each registration using `{ $sum: 1 }`.
- **Stage 2 (`$sort`):** Sort by `total` descending (`-1`) so the most popular events appear first.

**What to replace `const rows = [];` with:**
```javascript
  const rows = await db
    .collection("registrations")
    .aggregate([
      { $group: { _id: "$event", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ])
    .toArray();
```
**Test it:** Save the file and check the **Registration Summary by Event** table at the bottom of the webpage!

---

## Quick MongoDB Node.js Driver Cheat Sheet

| Operation | MongoDB Driver Syntax |
| :--- | :--- |
| **Find Multiple** | `await db.collection("col").find(filter).sort({ field: -1 }).limit(10).toArray()` |
| **Insert One** | `await db.collection("col").insertOne(doc)` |
| **Update One** | `await db.collection("col").updateOne({ _id: new ObjectId(id) }, { $set: { field: value } })` |
| **Delete One** | `await db.collection("col").deleteOne({ _id: new ObjectId(id) })` |
| **Aggregate** | `await db.collection("col").aggregate([ { $group: ... }, { $sort: ... } ]).toArray()` |
