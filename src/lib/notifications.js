// Notifications are worked out from the data, so there is nothing extra to store.
// alerts  = things that need action right now (overdue, reminders, waiting decisions)
// updates = new events involving you since you last marked them as read

const HOUR = 3600000;
const fmt = (t) => new Date(t).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export function getNotifications(s, user) {
  const now = Date.now();
  const alerts = [];
  const nameOf = (b) => s.resources.find((r) => r.id === b.resourceId)?.name ?? "item";

  if (user.role === "student") {
    for (const b of s.bookings.filter((x) => x.userId === user.id)) {
      if (b.status === "in_use" && now > b.endAt) {
        alerts.push(`Overdue: please return ${nameOf(b)} now.`);
      } else if (b.status === "in_use" && b.endAt - now < HOUR) {
        alerts.push(`Due soon: return ${nameOf(b)} by ${fmt(b.endAt)}.`);
      }
      if (b.status === "approved" && b.startAt > now && b.startAt - now < 24 * HOUR) {
        alerts.push(`Reminder: ${nameOf(b)} starts ${fmt(b.startAt)}.`);
      }
    }
  } else {
    const mine = s.bookings.filter(
      (b) => user.role === "admin" || s.resources.find((r) => r.id === b.resourceId)?.ownerId === user.id
    );
    const plural = (n, word) => `${n} ${word}${n > 1 ? "s" : ""}`;
    const pending = mine.filter((b) => b.status === "pending").length;
    const returned = mine.filter((b) => b.status === "returned").length;
    const overdue = mine.filter((b) => b.status === "in_use" && now > b.endAt).length;
    const open = s.incidents.filter((i) => i.status === "open" && mine.some((b) => b.id === i.bookingId)).length;

    if (pending) alerts.push(`${plural(pending, "booking request")} waiting for your decision.`);
    if (returned) alerts.push(`${plural(returned, "return")} waiting for your confirmation.`);
    if (overdue) alerts.push(`${plural(overdue, "item")} past the return time.`);
    if (open) alerts.push(`${plural(open, "open incident")} to resolve.`);
  }

  const seen = s.seen?.[user.id] ?? "";
  const updates = s.audit
    .filter((e) => e.involves?.includes(user.id) && e.actorId !== user.id && e.action !== "Signed in" && e.at > seen)
    .slice(0, 8)
    .map((e) => ({ id: e.id, text: `${e.action}: ${e.detail}` }));

  return { alerts, updates };
}
