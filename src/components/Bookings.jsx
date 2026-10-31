import { useState } from "react";
import { decideBooking, cancelBooking, confirmReturn, resolveIncident, demoMakeLate } from "../lib/store";
import { certName, CONDITIONS, OUTCOMES } from "../lib/rules";
import ConditionDialog from "./ConditionDialog";
import IncidentDialog from "./IncidentDialog";

const BADGE = {
  pending: "bg-amber-100 text-amber-900",
  approved: "bg-emerald-100 text-emerald-900",
  rejected: "bg-red-100 text-red-900",
  waitlisted: "bg-sky-100 text-sky-900",
  cancelled: "bg-ink/10 text-ink/70",
  in_use: "bg-violet-100 text-violet-900",
  returned: "bg-orange-100 text-orange-900",
  completed: "bg-teal-100 text-teal-900",
};
const LABEL = {
  pending: "Awaiting review",
  approved: "Approved",
  rejected: "Rejected",
  waitlisted: "Waiting list",
  cancelled: "Cancelled",
  in_use: "In use",
  returned: "Returned, awaiting confirmation",
  completed: "Completed",
};
const TYPE = { damage: "Damage", delay: "Delay", condition: "Condition change", other: "Other" };
const fmt = (t) => new Date(t).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
const field = "mt-1 w-full rounded-md border border-ink/20 bg-white px-3 py-2 text-sm";
const outlineBtn = "rounded-md border border-ink/25 px-3 py-1.5 text-sm";
const primaryBtn = "rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white";

function ReviewActions({ b, actorId }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  function decide(decision) {
    const result = decideBooking(b.id, actorId, decision, reason);
    if (!result.ok) setError(result.error);
  }

  return (
    <div className="space-y-2 pt-1">
      <label className="block text-sm">
        <span className="font-medium">Reason (needed to reject or waitlist)</span>
        <input
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError("");
          }}
          className={field}
        />
      </label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-2 text-sm font-medium">
        <button type="button" onClick={() => decide("approved")} className="rounded-md bg-emerald-700 px-3 py-1.5 text-white">
          Approve
        </button>
        <button type="button" onClick={() => decide("waitlisted")} className={outlineBtn}>
          Put on waiting list
        </button>
        <button type="button" onClick={() => decide("rejected")} className="rounded-md border border-red-300 px-3 py-1.5 text-red-800">
          Reject
        </button>
      </div>
    </div>
  );
}

function ConfirmReturn({ b, actorId }) {
  const [error, setError] = useState("");
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => {
          const result = confirmReturn(b.id, actorId);
          if (!result.ok) setError(result.error);
        }}
        className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white"
      >
        Confirm return
      </button>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  );
}

function ResolveForm({ incident, actorId }) {
  const [outcome, setOutcome] = useState("dismissed");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="mt-2 space-y-2">
      <label className="block text-sm font-medium">
        Your decision
        <select value={outcome} onChange={(e) => setOutcome(e.target.value)} className={field}>
          {Object.entries(OUTCOMES).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        Note for the student
        <input
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setError("");
          }}
          className={field}
        />
      </label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button
        type="button"
        onClick={() => {
          const result = resolveIncident(incident.id, actorId, outcome, note);
          if (!result.ok) setError(result.error);
        }}
        className={primaryBtn}
      >
        Resolve incident
      </button>
    </div>
  );
}

function Row({ b, resource, users, user, reviewer, incidents, audit, children }) {
  const nameOf = (id) => (id === "system" ? "automatic check" : users.find((u) => u.id === id)?.name ?? "Unknown");
  const student = users.find((u) => u.id === b.userId);
  const overdue = b.status === "in_use" && Date.now() > b.endAt;
  const events = audit.filter((e) => e.bookingId === b.id).slice().reverse();

  return (
    <li className="space-y-2 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{resource.name}</h3>
        <div className="flex gap-2">
          {overdue && <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-900">Overdue</span>}
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE[b.status]}`}>{LABEL[b.status]}</span>
        </div>
      </div>
      <p className="text-sm text-ink/80">
        {fmt(b.startAt)} to {fmt(b.endAt)} ({b.hours} h)
      </p>
      {reviewer && (
        <p className="text-sm text-ink/80">
          Requested by {student.name} ({student.dept}). Training: {student.certs.length ? student.certs.map(certName).join(", ") : "none"}.
        </p>
      )}
      <p className="text-sm text-ink/80">Purpose: {b.purpose}</p>
      <p className="text-sm text-ink/60">Note: {b.reason}</p>

      {(b.checkIn || b.returnInfo) && (
        <div className="space-y-0.5 rounded-md bg-paper px-3 py-2 text-sm">
          {b.checkIn && (
            <p>
              Check-in condition: <strong>{CONDITIONS[b.checkIn.condition]}</strong>
              {b.checkIn.notes && `. ${b.checkIn.notes}`} <span className="text-ink/60">({fmt(b.checkIn.at)})</span>
            </p>
          )}
          {b.returnInfo && (
            <p>
              Return condition: <strong>{CONDITIONS[b.returnInfo.condition]}</strong>
              {b.returnInfo.notes && `. ${b.returnInfo.notes}`} <span className="text-ink/60">({fmt(b.returnInfo.at)})</span>
            </p>
          )}
        </div>
      )}

      {incidents.map((i) => (
        <div key={i.id} className={`rounded-md border px-3 py-2 text-sm ${i.status === "open" ? "border-amber-300 bg-amber-50" : "border-ink/15"}`}>
          <p>
            <span className="font-medium">{TYPE[i.type]} ({i.status}):</span> {i.description}
          </p>
          <p className="text-ink/60">Reported by {nameOf(i.reportedBy)}</p>
          {i.status === "resolved" && (
            <p>
              Outcome: <strong>{OUTCOMES[i.outcome]}</strong>. {i.resolution}
            </p>
          )}
          {i.status === "open" && reviewer && <ResolveForm incident={i} actorId={user.id} />}
        </div>
      ))}

      {children}

      <details className="text-sm">
        <summary className="cursor-pointer text-ink/70">History ({events.length})</summary>
        <ol className="mt-2 space-y-1 border-l border-ink/20 pl-3">
          {events.map((e) => (
            <li key={e.id}>
              <time className="tabular-nums text-ink/60">{fmt(e.at)}</time> {e.action} by {nameOf(e.actorId)}
            </li>
          ))}
        </ol>
      </details>
    </li>
  );
}

function List({ children }) {
  return <ul className="divide-y divide-ink/10 rounded-md border border-ink/15 bg-white">{children}</ul>;
}

export default function Bookings({ bookings, resources, users, incidents, audit, user }) {
  const [dialog, setDialog] = useState(null);
  const resOf = (id) => resources.find((r) => r.id === id);
  const reviewer = user.role !== "student";
  const incOf = (b) => incidents.filter((i) => i.bookingId === b.id);

  const visible = reviewer
    ? bookings.filter((b) => user.role === "admin" || resOf(b.resourceId).ownerId === user.id)
    : bookings.filter((b) => b.userId === user.id);

  const needsAttention = (b) =>
    b.status === "pending" || b.status === "returned" || incOf(b).some((i) => i.status === "open");
  const attention = reviewer ? visible.filter(needsAttention) : [];
  const rest = reviewer ? visible.filter((b) => !needsAttention(b)) : visible;

  const renderRow = (b) => (
    <Row
      key={b.id}
      b={b}
      resource={resOf(b.resourceId)}
      users={users}
      user={user}
      reviewer={reviewer}
      incidents={incOf(b)}
      audit={audit}
    >
      {reviewer && b.status === "pending" && <ReviewActions b={b} actorId={user.id} />}
      {reviewer && b.status === "returned" && <ConfirmReturn b={b} actorId={user.id} />}
      <div className="flex flex-wrap items-center gap-2">
        {!reviewer && b.status === "approved" && (
          <button type="button" onClick={() => setDialog({ kind: "checkin", b })} className={primaryBtn}>
            Check in
          </button>
        )}
        {!reviewer && b.status === "in_use" && (
          <button type="button" onClick={() => setDialog({ kind: "return", b })} className={primaryBtn}>
            Return
          </button>
        )}
        {!reviewer && ["pending", "approved", "waitlisted"].includes(b.status) && (
          <button type="button" onClick={() => cancelBooking(b.id, user.id)} className={outlineBtn}>
            Cancel booking
          </button>
        )}
        {["in_use", "returned", "completed"].includes(b.status) && (
          <button type="button" onClick={() => setDialog({ kind: "incident", b })} className={outlineBtn}>
            Report a problem
          </button>
        )}
        {b.status === "in_use" && (
          <button type="button" onClick={() => demoMakeLate(b.id)} className="text-sm text-ink/50 underline">
            Demo: simulate a past return time
          </button>
        )}
      </div>
    </Row>
  );

  return (
    <section className="space-y-8">
      {reviewer && (
        <div>
          <h2 className="mb-3 text-xl font-semibold">Needs your attention</h2>
          {attention.length === 0 ? (
            <p className="rounded-md border border-dashed border-ink/25 p-6 text-sm text-ink/70">
              Nothing is waiting for you. New requests, returns and incidents will appear here.
            </p>
          ) : (
            <List>{attention.map(renderRow)}</List>
          )}
        </div>
      )}

      <div>
        <h2 className="mb-3 text-xl font-semibold">{reviewer ? "All other bookings" : "My bookings"}</h2>
        {rest.length === 0 ? (
          <p className="rounded-md border border-dashed border-ink/25 p-6 text-sm text-ink/70">
            {reviewer ? "Nothing here yet." : "You have no bookings yet. Browse resources and request one."}
          </p>
        ) : (
          <List>{rest.map(renderRow)}</List>
        )}
      </div>

      {dialog && dialog.kind === "incident" && (
        <IncidentDialog booking={dialog.b} resource={resOf(dialog.b.resourceId)} user={user} onClose={() => setDialog(null)} />
      )}
      {dialog && dialog.kind !== "incident" && (
        <ConditionDialog
          mode={dialog.kind}
          booking={dialog.b}
          resource={resOf(dialog.b.resourceId)}
          user={user}
          onClose={() => setDialog(null)}
        />
      )}
    </section>
  );
}
