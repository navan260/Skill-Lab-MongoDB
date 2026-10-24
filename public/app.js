// ============================================================================
// public/app.js
// Frontend logic for CampusConnect: Event Registrations.
// Uses textContent everywhere when rendering user/DB data to prevent XSS.
// ============================================================================

const apiLogs = [];
const MAX_LOGS = 10;

// DOM Elements
const dbStatusPill = document.getElementById("db-status-pill");
const dbStatusText = document.getElementById("db-status-text");
const apiLogList = document.getElementById("api-log-list");

const form = document.getElementById("registration-form");
const eventSelect = document.getElementById("event");
const eventFallback = document.getElementById("eventFallback");
const submitBtn = document.getElementById("submit-btn");
const formFeedback = document.getElementById("form-feedback");

const eventSearchInput = document.getElementById("event-search");
const tableLoading = document.getElementById("table-loading");
const tableEmpty = document.getElementById("table-empty");
const tableWrapper = document.getElementById("table-wrapper");
const registrationsTbody = document.getElementById("registrations-tbody");

const insightsTotalCount = document.getElementById("insights-total-count");
const insightsContainer = document.getElementById("insights-container");

// Map event name -> eventId if loaded from /api/events
const eventIdByName = new Map();

// ----------------------------------------------------------------------------
// 1. Tracked Fetch Wrapper (logs every API call to the API Activity panel)
// ----------------------------------------------------------------------------
async function apiFetch(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const startTime = performance.now();
  let status = "ERR";

  try {
    const response = await fetch(url, options);
    status = response.status;
    const durationMs = Math.round(performance.now() - startTime);
    recordApiLog(method, url, status, durationMs);

    let data = null;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await response.json();
    }
    return { ok: response.ok, status: response.status, data };
  } catch (err) {
    const durationMs = Math.round(performance.now() - startTime);
    recordApiLog(method, url, status, durationMs);
    throw err;
  }
}

function recordApiLog(method, url, status, durationMs) {
  apiLogs.unshift({ method, url, status, durationMs });
  if (apiLogs.length > MAX_LOGS) {
    apiLogs.pop();
  }
  renderApiLogs();
}

function renderApiLogs() {
  apiLogList.textContent = "";

  if (apiLogs.length === 0) {
    const emptyLi = document.createElement("li");
    emptyLi.className = "empty-log";
    emptyLi.textContent = "No API requests logged yet.";
    apiLogList.appendChild(emptyLi);
    return;
  }

  for (const entry of apiLogs) {
    const li = document.createElement("li");
    li.className = "api-log-item";

    const left = document.createElement("div");
    left.className = "api-log-left";

    const methodSpan = document.createElement("span");
    methodSpan.className = "api-method";
    methodSpan.textContent = entry.method;

    const urlSpan = document.createElement("span");
    urlSpan.className = "api-url";
    urlSpan.textContent = entry.url;
    urlSpan.title = entry.url;

    left.appendChild(methodSpan);
    left.appendChild(urlSpan);

    const right = document.createElement("div");
    right.className = "api-log-right";

    const statusSpan = document.createElement("span");
    const isSuccess = typeof entry.status === "number" && entry.status >= 200 && entry.status < 300;
    statusSpan.className = isSuccess ? "api-status-ok" : "api-status-err";
    statusSpan.textContent = String(entry.status);

    const timeSpan = document.createElement("span");
    timeSpan.className = "api-time";
    timeSpan.textContent = `${entry.durationMs} ms`;

    right.appendChild(statusSpan);
    right.appendChild(timeSpan);

    li.appendChild(left);
    li.appendChild(right);
    apiLogList.appendChild(li);
  }
}

// ----------------------------------------------------------------------------
// 2. Health Check (/api/health)
// ----------------------------------------------------------------------------
async function loadHealth() {
  try {
    const { ok, data } = await apiFetch("/api/health");
    const isConnected = ok && data && data.database === "connected";

    dbStatusPill.classList.remove("status-connected", "status-disconnected");
    dbStatusPill.classList.add(isConnected ? "status-connected" : "status-disconnected");
    dbStatusText.textContent = isConnected
      ? "Database: connected"
      : "Database: not connected";
  } catch (_) {
    dbStatusPill.classList.remove("status-connected");
    dbStatusPill.classList.add("status-disconnected");
    dbStatusText.textContent = "Database: not connected";
  }
}

// ----------------------------------------------------------------------------
// 3. Events Dropdown (/api/events)
// ----------------------------------------------------------------------------
async function loadEvents() {
  eventSelect.textContent = "";
  eventIdByName.clear();

  try {
    const { ok, data } = await apiFetch("/api/events");
    const events = ok && Array.isArray(data) ? data : [];

    if (events.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "No events available";
      eventSelect.appendChild(opt);
      eventFallback.classList.remove("hidden");
      return;
    }

    eventFallback.classList.add("hidden");

    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "-- Select an event --";
    eventSelect.appendChild(defaultOpt);

    for (const ev of events) {
      const name = ev.name || ev.title || ev.event || "";
      if (!name) continue;
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = ev.date ? `${name} (${formatShortDate(ev.date)})` : name;
      eventSelect.appendChild(opt);

      if (ev._id || ev.eventId) {
        eventIdByName.set(name, String(ev.eventId || ev._id));
      }
    }
  } catch (_) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No events available";
    eventSelect.appendChild(opt);
    eventFallback.classList.remove("hidden");
  }
}

// ----------------------------------------------------------------------------
// 4. Registrations Table (/api/registrations)
// ----------------------------------------------------------------------------
async function loadRegistrations(searchQuery = "") {
  tableLoading.classList.remove("hidden");
  tableEmpty.classList.add("hidden");

  const trimmed = searchQuery.trim();
  const url = trimmed
    ? `/api/registrations?event=${encodeURIComponent(trimmed)}`
    : "/api/registrations";

  try {
    const { ok, data } = await apiFetch(url);
    const rows = ok && Array.isArray(data) ? data : [];
    renderRegistrationsTable(rows);
  } catch (_) {
    renderRegistrationsTable([]);
  } finally {
    tableLoading.classList.add("hidden");
  }
}

function renderRegistrationsTable(registrations) {
  registrationsTbody.textContent = "";

  if (!registrations || registrations.length === 0) {
    tableWrapper.classList.add("hidden");
    tableEmpty.classList.remove("hidden");
    return;
  }

  tableEmpty.classList.add("hidden");
  tableWrapper.classList.remove("hidden");

  for (const reg of registrations) {
    const tr = document.createElement("tr");

    // Name
    const tdName = document.createElement("td");
    tdName.textContent = reg.studentName || "—";
    tr.appendChild(tdName);

    // Email
    const tdEmail = document.createElement("td");
    tdEmail.textContent = reg.email || "—";
    tr.appendChild(tdEmail);

    // Event
    const tdEvent = document.createElement("td");
    tdEvent.textContent = reg.event || "—";
    tr.appendChild(tdEvent);

    // Year
    const tdYear = document.createElement("td");
    tdYear.textContent = reg.year !== undefined && reg.year !== null ? String(reg.year) : "—";
    tr.appendChild(tdYear);

    // City
    const tdCity = document.createElement("td");
    tdCity.textContent = reg.city || "—";
    tr.appendChild(tdCity);

    // Status Badge
    const tdStatus = document.createElement("td");
    const statusValue = (reg.status || "pending").toLowerCase();
    const badge = document.createElement("span");
    badge.className = `badge badge-${statusValue}`;
    badge.textContent = statusValue;
    tdStatus.appendChild(badge);
    tr.appendChild(tdStatus);

    // Registered at
    const tdDate = document.createElement("td");
    tdDate.textContent = reg.createdAt ? formatDateTime(reg.createdAt) : "—";
    tr.appendChild(tdDate);

    // Actions (Confirm & Delete)
    const tdActions = document.createElement("td");
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "actions-cell";

    const id = reg._id ? String(reg._id) : "";

    const confirmBtn = document.createElement("button");
    confirmBtn.type = "button";
    confirmBtn.className = "btn btn-sm btn-confirm";
    confirmBtn.textContent = "Confirm";
    confirmBtn.disabled = !id || statusValue === "confirmed";
    confirmBtn.addEventListener("click", () => handleConfirmRegistration(id, confirmBtn));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn btn-sm btn-delete";
    deleteBtn.textContent = "Delete";
    deleteBtn.disabled = !id;
    deleteBtn.addEventListener("click", () => handleDeleteRegistration(id, reg.studentName, deleteBtn));

    actionsDiv.appendChild(confirmBtn);
    actionsDiv.appendChild(deleteBtn);
    tdActions.appendChild(actionsDiv);
    tr.appendChild(tdActions);

    registrationsTbody.appendChild(tr);
  }
}

async function handleConfirmRegistration(id, buttonEl) {
  if (!id) return;
  buttonEl.disabled = true;

  try {
    const { ok, data } = await apiFetch(`/api/registrations/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "confirmed" }),
    });

    if (!ok) {
      alert((data && data.error) || "Could not update status.");
      buttonEl.disabled = false;
      return;
    }

    await refreshDataAfterMutation();
  } catch (_) {
    alert("Network error while updating registration status.");
    buttonEl.disabled = false;
  }
}

async function handleDeleteRegistration(id, studentName, buttonEl) {
  if (!id) return;
  const label = studentName ? `registration for "${studentName}"` : "this registration";
  if (!window.confirm(`Are you sure you want to delete ${label}?`)) {
    return;
  }

  buttonEl.disabled = true;
  try {
    const { ok, data } = await apiFetch(`/api/registrations/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    if (!ok) {
      alert((data && data.error) || "Could not delete registration.");
      buttonEl.disabled = false;
      return;
    }

    await refreshDataAfterMutation();
  } catch (_) {
    alert("Network error while deleting registration.");
    buttonEl.disabled = false;
  }
}

// ----------------------------------------------------------------------------
// 5. Insights Card (/api/stats/by-event)
// ----------------------------------------------------------------------------
async function loadInsights() {
  try {
    const { ok, data } = await apiFetch("/api/stats/by-event");
    const stats = ok && Array.isArray(data) ? data : [];
    renderInsights(stats);
  } catch (_) {
    renderInsights([]);
  }
}

function renderInsights(stats) {
  insightsContainer.textContent = "";

  if (!stats || stats.length === 0) {
    insightsTotalCount.textContent = "0";
    const emptyP = document.createElement("p");
    emptyP.className = "empty-state";
    emptyP.textContent = "No event statistics available yet.";
    insightsContainer.appendChild(emptyP);
    return;
  }

  const totalAll = stats.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const maxCount = Math.max(...stats.map((item) => Number(item.total) || 0), 1);
  insightsTotalCount.textContent = String(totalAll);

  for (const item of stats) {
    const eventName = item.event || "Unnamed Event";
    const count = Number(item.total) || 0;
    const widthPercent = Math.round((count / maxCount) * 100);

    const row = document.createElement("div");
    row.className = "insight-row";

    const labelRow = document.createElement("div");
    labelRow.className = "insight-label-row";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = eventName;

    const countSpan = document.createElement("span");
    countSpan.textContent = String(count);

    labelRow.appendChild(nameSpan);
    labelRow.appendChild(countSpan);

    const track = document.createElement("div");
    track.className = "insight-bar-track";

    const fill = document.createElement("div");
    fill.className = "insight-bar-fill";
    fill.style.width = `${widthPercent}%`;

    track.appendChild(fill);
    row.appendChild(labelRow);
    row.appendChild(track);
    insightsContainer.appendChild(row);
  }
}

// ----------------------------------------------------------------------------
// 6. Registration Form Submission (POST /api/registrations)
// ----------------------------------------------------------------------------
function clearFieldErrors() {
  for (const id of ["error-studentName", "error-email", "error-event", "error-year"]) {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  }
  formFeedback.className = "feedback-banner hidden";
  formFeedback.textContent = "";
}

function showBanner(message, type) {
  formFeedback.textContent = message;
  formFeedback.className = `feedback-banner ${
    type === "success" ? "feedback-success" : "feedback-error"
  }`;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearFieldErrors();

  const studentName = document.getElementById("studentName").value.trim();
  const email = document.getElementById("email").value.trim();
  const selectedEvent = eventSelect.value.trim();
  const fallbackEvent = eventFallback.value.trim();
  const event = selectedEvent || fallbackEvent;
  const yearRaw = document.getElementById("year").value.trim();
  const city = document.getElementById("city").value.trim();
  const interests = document.getElementById("interests").value.trim();
  const vegetarian = document.getElementById("vegetarian").checked;

  // Inline client validation
  let hasError = false;
  if (!studentName) {
    document.getElementById("error-studentName").textContent = "Student name is required.";
    hasError = true;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById("error-email").textContent = "Enter a valid email address.";
    hasError = true;
  }
  if (!event) {
    document.getElementById("error-event").textContent = "Please select or enter an event.";
    hasError = true;
  }
  if (yearRaw !== "") {
    const y = Number(yearRaw);
    if (!Number.isInteger(y) || y < 1 || y > 4) {
      document.getElementById("error-year").textContent = "Year must be between 1 and 4.";
      hasError = true;
    }
  }

  if (hasError) return;

  const payload = {
    studentName,
    email,
    event,
    ...(eventIdByName.has(event) ? { eventId: eventIdByName.get(event) } : {}),
    ...(yearRaw !== "" ? { year: Number(yearRaw) } : {}),
    ...(city ? { city } : {}),
    interests,
    dietaryNeeds: { vegetarian },
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  try {
    const { ok, status, data } = await apiFetch("/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (status === 201 && ok) {
      const newId = data && data.id ? String(data.id) : "null (placeholder)";
      showBanner(`Registration created! Document ID: ${newId}`, "success");
      form.reset();
      await refreshDataAfterMutation();
    } else if (status === 400 || status === 409 || status === 500) {
      showBanner((data && data.error) || `Request failed (${status})`, "error");
    } else {
      showBanner((data && data.error) || "Unexpected response from server.", "error");
    }
  } catch (_) {
    showBanner("Could not reach the server. Please check if the backend is running.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Registration";
  }
});

// ----------------------------------------------------------------------------
// 7. Debounced Search (300ms) & Helpers
// ----------------------------------------------------------------------------
let searchTimeout = null;
eventSearchInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadRegistrations(eventSearchInput.value);
  }, 300);
});

async function refreshDataAfterMutation() {
  await Promise.all([
    loadRegistrations(eventSearchInput.value),
    loadInsights(),
  ]);
}

function formatShortDate(dateVal) {
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(dateVal) {
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ----------------------------------------------------------------------------
// Initialize Page on Load
// ----------------------------------------------------------------------------
async function initPage() {
  await Promise.all([
    loadHealth(),
    loadEvents(),
    loadRegistrations(""),
    loadInsights(),
  ]);
}

document.addEventListener("DOMContentLoaded", initPage);
