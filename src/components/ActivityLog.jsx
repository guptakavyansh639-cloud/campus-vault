// Shows the audit trail. Admins see everything; everyone else sees only their own actions.

export default function ActivityLog({ audit, users, user }) {
  const entries = user.role === "admin" ? audit : audit.filter((e) => e.actorId === user.id || e.involves?.includes(user.id));
  const nameOf = (id) => (id === "system" ? "automatic check" : users.find((u) => u.id === id)?.name ?? "Unknown");

  return (
    <section>
      <h2 className="text-xl font-semibold">Activity log</h2>
      <p className="mb-4 mt-1 text-sm text-ink/70">
        {user.role === "admin"
          ? "Every recorded action on the platform."
          : "Actions that involve you. Admins can see the full history."}
      </p>

      {entries.length === 0 ? (
        <p className="rounded-md border border-dashed border-ink/25 p-6 text-sm text-ink/70">
          Nothing recorded yet. Switch accounts or make a booking and it will show up here.
        </p>
      ) : (
        <ul className="divide-y divide-ink/10 rounded-md border border-ink/15 bg-white">
          {entries.map((e) => (
            <li key={e.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4">
              <time className="w-44 shrink-0 text-sm tabular-nums text-ink/60" dateTime={e.at}>
                {new Date(e.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </time>
              <div className="text-sm">
                <span className="font-medium">{e.action}</span>
                <span className="text-ink/70">: {e.detail}</span>
                <span className="text-ink/50"> by {nameOf(e.actorId)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
