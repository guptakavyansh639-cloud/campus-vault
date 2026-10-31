// The rules of the platform live here: eligibility now, fair-use limits and
// conflict checks later. Keeping them in one file makes decisions easy to
// explain to judges ("rejected because ...").

import { certifications } from "../data/seed";

export function certName(id) {
  return certifications.find((c) => c.id === id)?.name ?? id;
}

// Does this user have every training/qualification the resource requires?
export function checkEligibility(user, resource) {
  const have = new Set(user.certs);
  const missing = resource.requires.filter((id) => !have.has(id));
  return { eligible: missing.length === 0, missing };
}

// ---------- Booking rules ----------

// Fair use: nobody can hold more than this many pending/approved bookings at once
export const FAIR_USE_LIMIT = 2;
const ACTIVE = ["pending", "approved", "in_use"];

// These statuses occupy the time slot
export const HOLDS = ["approved", "in_use"];

export const CONDITIONS = { excellent: "Excellent", good: "Good", worn: "Minor wear", damaged: "Damaged" };
export const RANK = { excellent: 0, good: 1, worn: 2, damaged: 3 };
export const OUTCOMES = { dismissed: "No action needed", warning: "Warning issued", deposit: "Deposit withheld" };

export function bookingTimes(date, start, hours) {
  const startAt = new Date(`${date}T${start}`).getTime();
  return { startAt, endAt: startAt + hours * 3600000 };
}

export function overlaps(a, b) {
  return a.startAt < b.endAt && b.startAt < a.endAt;
}

// Runs every automatic check on a booking request.
// errors  = reasons the request cannot even be submitted
// conflict = true when an approved booking already holds that time (request goes to the waiting list)
export function checkBooking(s, user, resource, form) {
  const errors = [];
  const hours = Number(form.hours);

  if (!form.date || !form.start) errors.push("Choose a date and a start time.");
  if (!(hours > 0)) errors.push("Enter how many hours you need.");
  else if (hours > resource.maxHours) {
    errors.push(`${resource.name} can be booked for at most ${resource.maxHours} h at a time.`);
  }
  if (!form.purpose.trim()) errors.push("Tell the owner what you will use it for.");

  const { eligible, missing } = checkEligibility(user, resource);
  if (!eligible) errors.push(`You still need: ${missing.map(certName).join(", ")}.`);

  const overdue = s.bookings.some((b) => b.userId === user.id && b.status === "in_use" && b.endAt < Date.now());
  if (overdue) errors.push("You have an item that is past its return time. Return it before requesting another.");

  const times = form.date && form.start ? bookingTimes(form.date, form.start, hours) : null;
  if (times && times.startAt < Date.now()) errors.push("Pick a start time in the future.");

  const active = s.bookings.filter(
    (b) => b.userId === user.id && ACTIVE.includes(b.status) && (b.status === "in_use" || b.endAt > Date.now())
  ).length;
  if (active >= FAIR_USE_LIMIT) {
    errors.push(`Fair-use limit: you can hold at most ${FAIR_USE_LIMIT} active bookings at once. Cancel one or wait until it ends.`);
  }

  const conflict =
    !!times &&
    s.bookings.some((b) => b.resourceId === resource.id && HOLDS.includes(b.status) && overlaps(b, times));

  return { ok: errors.length === 0, errors, conflict, times };
}
