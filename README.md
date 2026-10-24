# CampusConnect: Event Registrations

A minimal full-stack demo website for a college MongoDB workshop showing the complete request flow:
**Browser Form &rarr; Express API &rarr; MongoDB &rarr; JSON &rarr; Page Update**

## Quick Start (5 Steps)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   Copy `.env.example` to `.env` (already provided with defaults) and verify your settings:
   ```env
   MONGODB_URI=mongodb://localhost:27017
   DB_NAME=campusconnect
   PORT=3000
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   *(Or run `npm run dev` to auto-restart on file changes using `node --watch server.js`.)*

4. **Open the web page**
   Visit [http://localhost:3000](http://localhost:3000) in your browser. Even before MongoDB queries are implemented, the UI, API validation, and live API Activity log work out of the box.

5. **Implement the MongoDB queries live**
   Open `db/queries.js` — **all database commands live in this single file**. Replace each placeholder return value with the MongoDB driver call shown in its `TODO` comment block (`getEvents`, `getRegistrations`, `insertRegistration`, `updateRegistrationStatus`, `deleteRegistration`, and `getRegistrationCountsByEvent`).
