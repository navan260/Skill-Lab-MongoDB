// ============================================================================
// public/app.js
// Frontend logic for CampusConnect Event Registration Portal.
// ============================================================================

const kpiEventsCount = document.getElementById("kpi-events-count");
const kpiTotalRegistrations = document.getElementById("kpi-total-registrations");
const kpiConfirmedCount = document.getElementById("kpi-confirmed-count");
const kpiPendingCount = document.getElementById("kpi-pending-count");
const tabRegsBadge = document.getElementById("tab-regs-badge");

const form = document.getElementById("registration-form");
const eventSelect = document.getElementById("event");
const formFeedback = document.getElementById("form-feedback");
const eventsGrid = document.getElementById("events-grid");

const eventSearchInput = document.getElementById("event-search");
const statusFilterSelect = document.getElementById("status-filter");
const tableEmpty = document.getElementById("table-empty");
const tableWrapper = document.getElementById("table-wrapper");
const registrationsTbody = document.getElementById("registrations-tbody");

const insightsTotalCount = document.getElementById("insights-total-count");
const insightsContainer = document.getElementById("insights-container");

function escapeHtml(val) {
  return String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Switch between views
function switchTab(tabName, btnEl) {
  document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.add("hidden"));
  document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));

  document.getElementById(`tab-${tabName}`).classList.remove("hidden");
  const targetBtn = btnEl || document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  if (targetBtn) targetBtn.classList.add("active");

  if (tabName === "register") loadEvents();
  if (tabName === "registrations") loadRegistrations();
  if (tabName === "analytics") loadInsights();
}

// 1. Load Events
async function loadEvents() {
  try {
    const res = await fetch("/api/events");
    const events = await res.json();

    if (!Array.isArray(events)) return;
    kpiEventsCount.textContent = events.length;

    if (events.length === 0) {
      eventSelect.innerHTML = `<option value="">No events scheduled</option>`;
      eventsGrid.innerHTML = `<p class="empty-state">No upcoming events scheduled at this time.</p>`;
      return;
    }

    const currentVal = eventSelect.value;
    eventSelect.innerHTML =
      `<option value="">Select an event</option>` +
      events
        .map((ev) => {
          const feeLabel = ev.fee > 0 ? `Rs. ${ev.fee}` : "Free";
          return `<option value="${escapeHtml(ev.name)}" data-event-id="${escapeHtml(ev.eventId || "")}">${escapeHtml(ev.name)} (${escapeHtml(ev.category || "General")} - ${feeLabel})</option>`;
        })
        .join("");
    if (currentVal) eventSelect.value = currentVal;

    eventsGrid.innerHTML = events
      .map((ev) => {
        const dateStr = ev.date
          ? new Date(ev.date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "TBA";
        const feeText = ev.fee > 0 ? `Rs. ${ev.fee}` : "Free Entry";

        return `
          <div class="event-card">
            <div>
              <div class="event-card-top">
                <span class="event-category">${escapeHtml(ev.category || "Event")}</span>
                <span class="event-date">${escapeHtml(dateStr)}</span>
              </div>
              <div class="event-title">${escapeHtml(ev.name)}</div>
              <div class="event-meta" style="margin-top: 0.4rem;">
                <span>Venue: ${escapeHtml(ev.venue || "Main Campus")}</span>
                <span>Organizer: ${escapeHtml(ev.organizer || "Student Council")}</span>
              </div>
            </div>
            <div class="event-footer">
              <span class="event-fee">${feeText} &bull; Capacity: ${escapeHtml(ev.capacity || 100)}</span>
              <button type="button" class="btn btn-outline btn-xs" onclick="selectEventInForm('${escapeHtml(ev.name)}')">
                Select
              </button>
            </div>
          </div>
        `;
      })
      .join("");
  } catch {
    eventsGrid.innerHTML = `<p class="empty-state">Unable to load events.</p>`;
  }
}

function selectEventInForm(eventName) {
  eventSelect.value = eventName;
  document.getElementById("studentName").focus();
}

// 2. Load Registrations
async function loadRegistrations() {
  const search = eventSearchInput.value.trim();
  const status = statusFilterSelect.value.trim();

  const params = new URLSearchParams();
  if (search) params.set("event", search);
  if (status) params.set("status", status);
  params.set("limit", "100");

  try {
    const res = await fetch(`/api/registrations?${params.toString()}`);
    const rows = await res.json();

    tabRegsBadge.textContent = rows.length;

    const confirmed = rows.filter((r) => r.status === "confirmed").length;
    const pending = rows.filter((r) => r.status === "pending").length;
    kpiConfirmedCount.textContent = confirmed;
    kpiPendingCount.textContent = pending;

    if (!rows.length) {
      tableWrapper.classList.add("hidden");
      tableEmpty.classList.remove("hidden");
      return;
    }

    tableEmpty.classList.add("hidden");
    tableWrapper.classList.remove("hidden");

    registrationsTbody.innerHTML = rows
      .map((reg) => {
        const regStatus = (reg.status || "pending").toLowerCase();
        const yearDept = [reg.year ? `Year ${reg.year}` : null, reg.department].filter(Boolean).join(" - ") || "—";
        const interestsList = Array.isArray(reg.interests) ? reg.interests : [];
        const isVeg = reg.dietaryNeeds && reg.dietaryNeeds.vegetarian;

        const tagsHtml =
          (isVeg ? `<span class="tag-chip tag-veg">Vegetarian</span>` : "") +
          interestsList.slice(0, 3).map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join("");

        return `
          <tr>
            <td>
              <div class="student-name">${escapeHtml(reg.studentName || "—")}</div>
              <div class="student-email">${escapeHtml(reg.email || "—")}</div>
            </td>
            <td>${escapeHtml(reg.event || "—")}</td>
            <td>${escapeHtml(yearDept)}</td>
            <td>${escapeHtml(reg.city || "—")}</td>
            <td>${tagsHtml || "—"}</td>
            <td>
              <span class="badge badge-${escapeHtml(regStatus)}">${escapeHtml(regStatus)}</span>
            </td>
            <td>
              <div class="actions-cell">
                <select class="status-dropdown-inline" onchange="changeRegistrationStatus('${reg._id}', this.value)">
                  <option value="pending" ${regStatus === "pending" ? "selected" : ""}>Pending</option>
                  <option value="confirmed" ${regStatus === "confirmed" ? "selected" : ""}>Confirmed</option>
                  <option value="waitlisted" ${regStatus === "waitlisted" ? "selected" : ""}>Waitlisted</option>
                  <option value="cancelled" ${regStatus === "cancelled" ? "selected" : ""}>Cancelled</option>
                </select>
                <button class="btn btn-xs btn-delete" onclick="deleteRegistration('${reg._id}')">
                  Remove
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

function resetFilters() {
  eventSearchInput.value = "";
  statusFilterSelect.value = "";
  loadRegistrations();
}

// 3. Submit Registration
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formFeedback.className = "feedback-banner hidden";

  const selectedOption = eventSelect.options[eventSelect.selectedIndex];
  const eventId = selectedOption ? selectedOption.getAttribute("data-event-id") : undefined;

  const payload = {
    studentName: document.getElementById("studentName").value.trim(),
    email: document.getElementById("email").value.trim(),
    event: eventSelect.value,
    eventId: eventId || undefined,
    year: document.getElementById("year").value ? Number(document.getElementById("year").value) : undefined,
    department: document.getElementById("department").value || undefined,
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
      formFeedback.innerHTML = `
        <span>Registration submitted successfully.</span>
        <button type="button" class="btn btn-outline btn-xs" onclick="switchTab('registrations')">
          View Registrations
        </button>
      `;
      formFeedback.className = "feedback-banner feedback-success";
      form.reset();
      loadRegistrations();
      loadInsights();
    } else {
      formFeedback.textContent = data.error || "Unable to complete registration.";
      formFeedback.className = "feedback-banner feedback-error";
    }
  } catch {
    formFeedback.textContent = "Unable to connect to the server.";
    formFeedback.className = "feedback-banner feedback-error";
  }
});

// 4. Update Status
async function changeRegistrationStatus(id, newStatus) {
  await fetch(`/api/registrations/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus }),
  });
  loadRegistrations();
  loadInsights();
}

// 5. Delete Registration
async function deleteRegistration(id) {
  await fetch(`/api/registrations/${id}`, { method: "DELETE" });
  loadRegistrations();
  loadInsights();
}

// 6. Load Event Analytics
async function loadInsights() {
  try {
    const res = await fetch("/api/stats/by-event");
    const stats = await res.json();

    if (!stats.length) {
      insightsTotalCount.textContent = "0";
      kpiTotalRegistrations.textContent = "0";
      insightsContainer.innerHTML = `<p class="empty-state">No registration statistics available.</p>`;
      return;
    }

    const total = stats.reduce((sum, item) => sum + item.total, 0);
    const max = Math.max(...stats.map((item) => item.total), 1);

    insightsTotalCount.textContent = total;
    kpiTotalRegistrations.textContent = total;

    insightsContainer.innerHTML = stats
      .map((item) => {
        const pct = Math.round((item.total / max) * 100);
        const sharePct = Math.round((item.total / total) * 100);
        return `
          <div class="insight-row">
            <div class="insight-label-row">
              <span>${escapeHtml(item.event)}</span>
              <span>${item.total} registrations (${sharePct}%)</span>
            </div>
            <div class="insight-bar-track">
              <div class="insight-bar-fill" style="width: ${pct}%"></div>
            </div>
          </div>
        `;
      })
      .join("");
  } catch {
    insightsContainer.innerHTML = `<p class="empty-state">Unable to load statistics.</p>`;
  }
}

eventSearchInput.addEventListener("input", () => loadRegistrations());
statusFilterSelect.addEventListener("change", () => loadRegistrations());

// Initialize on load
loadEvents();
loadRegistrations();
loadInsights();
