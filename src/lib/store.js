// A tiny "database" that lives in the browser (localStorage).
// All data reads and writes go through this file, so later we can swap it
// for a real backend (Supabase / Firebase) without rewriting the screens.

import { useSyncExternalStore } from "react";
import { seed } from "../data/seed";
import { checkBooking, overlaps, HOLDS, RANK, CONDITIONS, OUTCOMES } from "./rules";

const KEY = "campus-vault-v1";

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...structuredClone(seed), ...JSON.parse(raw) }; // fills in any new fields
  } catch (e) {
    // If storage is blocked or broken, fall back to fresh demo data
  }
  return structuredClone(seed);
}

let state = load();
const listeners = new Set();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    // Ignore: the app still works, it just will not remember data after refresh
  }
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getState() {
  return state;
}

// Screens call this hook to read the data. They re-render when data changes.
export function useStore() {
  return useSyncExternalStore(subscribe, getState);
}

// Change the data: pass a function that takes the old state and returns the new one.
export function setState(updater) {
  state = updater(state);
  save();
  listeners.forEach((l) => l());
}

// Adds one entry to the audit log. Returns the new state (does not save by itself).
// "involves" lists other people who should also see this entry in their history.
export function addAudit(s, actorId, action, detail = "", involves = [], bookingId = null) {
  const entry = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    actorId,
    action,
    detail,
    involves: [actorId, ...involves],
    bookingId,
  };
  return { ...s, audit: [entry, ...s.audit] };
}

export function switchUser(userId) {
  setState((s) => {
    const user = s.users.find((u) => u.id === userId);
    const next = { ...s, currentUserId: userId };
    return addAudit(next, userId, "Signed in", `${user.name} signed in as ${user.role} (demo account)`);
  });
}

export function resetDemo() {
  setState(() => structuredClone(seed));
}

// ---------- Bookings ----------

const fmtDate = (t) => new Date(t).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

function describe(s, b) {
  const r = s.resources.find((x) => x.id === b.resourceId);
  const u = s.users.find((x) => x.id === b.userId);
  return `${r.name} for ${u.name}, ${fmtDate(b.startAt)}, ${b.hours} h`;
}

// The student and the resource owner both get each entry in their history
function people(s, b) {
  const r = s.resources.find((x) => x.id === b.resourceId);
  return [b.userId, r.ownerId];
}

// One place that writes a booking-related audit entry
function log(s, actorId, action, b, extra = "") {
  return addAudit(s, actorId, action, describe(s, b) + extra, people(s, b), b.id);
}

function patch(s, id, changes) {
  return { ...s, bookings: s.bookings.map((x) => (x.id === id ? { ...x, ...changes } : x)) };
}

function openIncident(s, b, reporter, type, description) {
  const incident = {
    id: crypto.randomUUID(),
    bookingId: b.id,
    resourceId: b.resourceId,
    reportedBy: reporter, // a user id, or "system" for automatic checks
    type,
    description,
    status: "open",
    createdAt: Date.now(),
  };
  return log({ ...s, incidents: [incident, ...s.incidents] }, reporter, "Incident reported", b, `. ${description}`);
}

export function requestBooking(userId, resourceId, form) {
  const user = state.users.find((u) => u.id === userId);
  const resource = state.resources.find((r) => r.id === resourceId);
  const check = checkBooking(state, user, resource, form);
  if (!check.ok) return check;

  const waitlisted = check.conflict;
  const position =
    state.bookings.filter(
      (b) => b.resourceId === resourceId && b.status === "waitlisted" && overlaps(b, check.times)
    ).length + 1;

  const booking = {
    id: crypto.randomUUID(),
    resourceId,
    userId,
    ...check.times,
    hours: Number(form.hours),
    purpose: form.purpose.trim(),
    status: waitlisted ? "waitlisted" : "pending",
    reason: waitlisted
      ? `That time is already booked. You are number ${position} on the waiting list and move up if it frees up.`
      : "Waiting for the owner to review.",
    createdAt: Date.now(),
  };

  setState((s) =>
    log(
      { ...s, bookings: [booking, ...s.bookings] },
      userId,
      waitlisted ? "Booking waitlisted" : "Booking requested",
      booking,
      waitlisted ? " (time already taken)" : ""
    )
  );
  return { ok: true, booking };
}

// The owner (or admin) decides. Reasons are saved so the student can see why.
export function decideBooking(bookingId, actorId, decision, reason) {
  const b = state.bookings.find((x) => x.id === bookingId);
  const text = reason.trim();

  if (decision !== "approved" && !text) {
    return { ok: false, error: "Please give a reason so the student understands the decision." };
  }
  const clash = state.bookings.some(
    (x) => x.id !== b.id && x.resourceId === b.resourceId && HOLDS.includes(x.status) && overlaps(x, b)
  );
  if (decision === "approved" && clash) {
    return { ok: false, error: "This overlaps a booking you already approved. Waitlist or reject it instead." };
  }

  const labels = { approved: "Booking approved", rejected: "Booking rejected", waitlisted: "Booking waitlisted" };
  setState((s) =>
    log(
      patch(s, bookingId, { status: decision, reason: text || "Approved by the owner.", decidedBy: actorId, decidedAt: Date.now() }),
      actorId,
      labels[decision],
      b,
      `. Reason: ${text || "none given"}`
    )
  );
  return { ok: true };
}

// Cancelling an approved booking frees the slot: the longest-waiting request goes back to the owner for review.
export function cancelBooking(bookingId, actorId) {
  const b = state.bookings.find((x) => x.id === bookingId);
  const wasApproved = b.status === "approved";

  setState((s) => {
    let next = log(patch(s, bookingId, { status: "cancelled", reason: "Cancelled by the student." }), actorId, "Booking cancelled", b);

    if (wasApproved) {
      const candidate = next.bookings
        .filter(
          (x) =>
            x.status === "waitlisted" &&
            x.resourceId === b.resourceId &&
            overlaps(x, b) &&
            !next.bookings.some((y) => HOLDS.includes(y.status) && y.resourceId === b.resourceId && overlaps(y, x))
        )
        .sort((p, q) => p.createdAt - q.createdAt)[0];

      if (candidate) {
        next = log(
          patch(next, candidate.id, { status: "pending", reason: "A slot opened up. Your request is back with the owner for review." }),
          actorId,
          "Waiting list moved up",
          candidate
        );
      }
    }
    return next;
  });
}

// ---------- Check-in, return, incidents ----------

export function checkIn(bookingId, actorId, condition, notes) {
  const b = state.bookings.find((x) => x.id === bookingId);
  setState((s) =>
    log(
      patch(s, bookingId, {
        status: "in_use",
        checkIn: { at: Date.now(), condition, notes: notes.trim() },
        reason: "In use. Return it by the booked end time.",
      }),
      actorId,
      "Checked in",
      b,
      ` (condition: ${CONDITIONS[condition]})`
    )
  );
}

// Returning records the final condition, then runs two automatic checks.
// The checks only open incidents. A person always decides what happens next.
export function returnItem(bookingId, actorId, condition, notes) {
  const b = state.bookings.find((x) => x.id === bookingId);
  setState((s) => {
    const now = Date.now();
    let next = patch(s, bookingId, {
      status: "returned",
      returnInfo: { at: now, condition, notes: notes.trim() },
      reason: "Returned. Waiting for the owner to confirm.",
    });
    next = log(next, actorId, "Returned", b, ` (condition: ${CONDITIONS[condition]})`);

    const lateMinutes = Math.round((now - b.endAt) / 60000);
    if (lateMinutes > 5) {
      next = openIncident(next, b, "system", "delay", `Returned ${lateMinutes} minutes after the booked end time.`);
    }
    if (RANK[condition] >= 2 && RANK[condition] > RANK[b.checkIn.condition]) {
      next = openIncident(
        next, b, "system", "condition",
        `Condition changed from ${CONDITIONS[b.checkIn.condition]} to ${CONDITIONS[condition]}. Needs owner review.`
      );
    }
    return next;
  });
}

export function confirmReturn(bookingId, actorId) {
  const b = state.bookings.find((x) => x.id === bookingId);
  if (state.incidents.some((i) => i.bookingId === bookingId && i.status === "open")) {
    return { ok: false, error: "Resolve the open incident first, then confirm the return." };
  }
  setState((s) => log(patch(s, bookingId, { status: "completed", reason: "Return confirmed by the owner." }), actorId, "Return confirmed", b));
  return { ok: true };
}

export function reportIncident(bookingId, actorId, type, description) {
  const text = description.trim();
  if (!text) return { ok: false, error: "Describe what happened." };
  const b = state.bookings.find((x) => x.id === bookingId);
  setState((s) => openIncident(s, b, actorId, type, text));
  return { ok: true };
}

export function resolveIncident(incidentId, actorId, outcome, note) {
  const text = note.trim();
  if (!text) return { ok: false, error: "Add a short note explaining your decision." };
  const inc = state.incidents.find((i) => i.id === incidentId);
  const b = state.bookings.find((x) => x.id === inc.bookingId);
  setState((s) =>
    log(
      {
        ...s,
        incidents: s.incidents.map((i) =>
          i.id === incidentId ? { ...i, status: "resolved", outcome, resolution: text, resolvedBy: actorId, resolvedAt: Date.now() } : i
        ),
      },
      actorId,
      "Incident resolved",
      b,
      `. Outcome: ${OUTCOMES[outcome]}. ${text}`
    )
  );
  return { ok: true };
}

// Demo helper so judges can see the late-return check without waiting
export function demoMakeLate(bookingId) {
  setState((s) => {
    const b = s.bookings.find((x) => x.id === bookingId);
    const endAt = Date.now() - 30 * 60000;
    return patch(s, bookingId, { endAt, startAt: endAt - b.hours * 3600000 });
  });
}

// ---------- Listing resources (owners) ----------

const ICON_BY_CATEGORY = {
  Fabrication: "printer",
  Media: "camera",
  Testing: "scope",
  Robotics: "drone",
  Electronics: "cpu",
  Spaces: "room",
  Other: "cpu",
};
export const CATEGORIES = Object.keys(ICON_BY_CATEGORY);

export function addResource(ownerId, form) {
  const errors = [];
  const maxHours = Number(form.maxHours);
  const deposit = Number(form.deposit || 0);

  if (!form.name.trim()) errors.push("Give the resource a name.");
  if (!form.location.trim()) errors.push("Say where it is located.");
  if (!form.availability.trim()) errors.push("Describe when it is available, for example Mon to Fri, 10:00 to 16:00.");
  if (!(maxHours > 0)) errors.push("Enter the longest booking length in hours.");
  if (!(deposit >= 0)) errors.push("Deposit cannot be negative.");
  if (!form.rules.trim()) errors.push("Add a usage rule so borrowers know what is expected.");
  if (errors.length) return { ok: false, errors };

  const resource = {
    id: `r${Date.now()}`,
    code: `CV-${String(state.resources.length + 1).padStart(3, "0")}`,
    name: form.name.trim(),
    category: form.category,
    icon: ICON_BY_CATEGORY[form.category],
    location: form.location.trim(),
    ownerId,
    availability: form.availability.trim(),
    maxHours,
    deposit,
    requires: form.requires,
    rules: form.rules.trim(),
  };
  setState((s) =>
    addAudit({ ...s, resources: [...s.resources, resource] }, ownerId, "Resource listed", `${resource.name} (${resource.code}) at ${resource.location}`)
  );
  return { ok: true };
}

// ---------- Notifications ----------

export function markNotificationsRead(userId) {
  setState((s) => ({ ...s, seen: { ...s.seen, [userId]: new Date().toISOString() } }));
}
