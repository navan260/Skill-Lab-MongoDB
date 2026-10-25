// ============================================================================
// public/app.js
// Simplified frontend logic — focuses purely on calling the Express/MongoDB API.
// ============================================================================

const dbStatusPill = document.getElementById("db-status-pill");
const dbStatusText = document.getElementById("db-status-text");
const form = document.getElementById("registration-form");
const eventSelect = document.getElementById("event");
const formFeedback = document.getElementById("form-feedback");
const eventSearchInput = document.getElementById("event-search");
const tableEmpty = document.getElementById("table-empty");
const tableWrapper = document.getElementById("table-wrapper");
const registrationsTbody = document.getElementById("registrations-tbody");
const insightsTotalCount = document.getElementById("insights-total-count");
const insightsContainer = document.getElementById("insights-container");

// Tab Switching
function switchTab(tabName, btnEl) {
  document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.add("hidden"));
  document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));

  document.getElementById(`tab-${tabName}`).classList.remove("hidden");
  if (btnEl) btnEl.classList.add("active");

  if (tabName === "register") loadEvents();
  if (tabName === "registrations") loadRegistrations(eventSearchInput.value.trim());
  if (tabName === "analytics") loadInsights();
}

// 1. Check Database Health (GET /api/health)
async function loadHealth() {
  try {
    const res = await fetch("/api/health");
    const data = await res.json();
    const isConnected = data.database === "connected";

    dbStatusPill.className = `status-pill ${isConnected ? "status-connected" : "status-disconnected"}`;
    dbStatusText.textContent = `Database: ${data.database}`;
  } catch {
    dbStatusPill.className = "status-pill status-disconnected";
    dbStatusText.textContent = "Database: not connected";
  }
}

// 2. Load Events into Dropdown (GET /api/events)
async function loadEvents() {
  try {
    const res = await fetch("/api/events");
    const events = await res.json();

    // Only overwrite default options if MongoDB returned events
    if (!Array.isArray(events) || events.length === 0) {
      return;
    }

    eventSelect.innerHTML =
      `<option value="">-- Select an event --</option>` +
      events
        .map((ev) => {
          const name = ev.name || ev.title || ev.event;
          return `<option value="${name}">${name}</option>`;
        })
        .join("");
  } catch {
    // Keep default options in HTML if request fails
  }
}

// 3. Load Registrations Table (GET /api/registrations)
async function loadRegistrations(search = "") {
  const url = search
    ? `/api/registrations?event=${encodeURIComponent(search)}`
    : "/api/registrations";

  try {
    const res = await fetch(url);
    const rows = await res.json();

    if (!rows.length) {
      tableWrapper.classList.add("hidden");
      tableEmpty.classList.remove("hidden");
      return;
    }

    tableEmpty.classList.add("hidden");
    tableWrapper.classList.remove("hidden");

    registrationsTbody.innerHTML = rows
      .map((reg) => {
        const status = (reg.status || "pending").toLowerCase();
        return `
          <tr>
            <td class="student-name">${reg.studentName || "—"}</td>
            <td>${reg.email || "—"}</td>
            <td>${reg.event || "—"}</td>
            <td>${reg.year || "—"}</td>
            <td>${reg.city || "—"}</td>
            <td><span class="badge badge-${status}">${status}</span></td>
            <td>
              <div class="actions-cell">
                <button class="btn btn-sm btn-confirm"
                  onclick="confirmRegistration('${reg._id}')"
                  ${status === "confirmed" ? "disabled" : ""}>
                  Confirm
                </button>
                <button class="btn btn-sm btn-delete"
                  onclick="deleteRegistration('${reg._id}')">
                  Delete
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  } catch {
    tableWrapper.classList.add("hidden");
    tableEmpty.classList.remove("hidden");
  }
}

// 4. Create Registration (POST /api/registrations)
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formFeedback.className = "feedback-banner hidden";

  const payload = {
    studentName: document.getElementById("studentName").value.trim(),
    email: document.getElementById("email").value.trim(),
    event: eventSelect.value,
    year: document.getElementById("year").value ? Number(document.getElementById("year").value) : undefined,
    city: document.getElementById("city").value.trim(),
    interests: document.getElementById("interests").value.trim(),
    dietaryNeeds: {
      vegetarian: document.getElementById("vegetarian").checked,
    },
  };

  try {
    const res = await fetch("/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (res.ok) {
      formFeedback.textContent = `Registration saved! ID: ${data.id}`;
      formFeedback.className = "feedback-banner feedback-success";
      form.reset();
      loadRegistrations(eventSearchInput.value.trim());
      loadInsights();
    } else {
      formFeedback.textContent = data.error || "Failed to register";
      formFeedback.className = "feedback-banner feedback-error";
    }
  } catch {
    formFeedback.textContent = "Could not reach server.";
    formFeedback.className = "feedback-banner feedback-error";
  }
});

// 5. Update Status (PATCH /api/registrations/:id/status)
async function confirmRegistration(id) {
  await fetch(`/api/registrations/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "confirmed" }),
  });
  loadRegistrations(eventSearchInput.value.trim());
  loadInsights();
}

// 6. Delete Registration (DELETE /api/registrations/:id)
async function deleteRegistration(id) {
  await fetch(`/api/registrations/${id}`, { method: "DELETE" });
  loadRegistrations(eventSearchInput.value.trim());
  loadInsights();
}

// 7. Load Aggregation Insights (GET /api/stats/by-event)
async function loadInsights() {
  try {
    const res = await fetch("/api/stats/by-event");
    const stats = await res.json();

    if (!stats.length) {
      insightsTotalCount.textContent = "0";
      insightsContainer.innerHTML = `<p class="empty-state">No event statistics available yet.</p>`;
      return;
    }

    const total = stats.reduce((sum, item) => sum + item.total, 0);
    const max = Math.max(...stats.map((item) => item.total), 1);
    insightsTotalCount.textContent = total;

    insightsContainer.innerHTML = stats
      .map((item) => {
        const pct = Math.round((item.total / max) * 100);
        return `
          <div class="insight-row">
            <div class="insight-label-row">
              <span>${item.event}</span>
              <span>${item.total}</span>
            </div>
            <div class="insight-bar-track">
              <div class="insight-bar-fill" style="width: ${pct}%"></div>
            </div>
          </div>
        `;
      })
      .join("");
  } catch {
    insightsContainer.innerHTML = `<p class="empty-state">Could not load statistics.</p>`;
  }
}

// Filter registrations when typing in search box
eventSearchInput.addEventListener("input", () => {
  loadRegistrations(eventSearchInput.value.trim());
});

// Initialize on page load
loadHealth();
loadEvents();
loadRegistrations();
loadInsights();
