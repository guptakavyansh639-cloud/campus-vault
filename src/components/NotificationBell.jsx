import { useState } from "react";
import { Bell } from "lucide-react";
import { getNotifications } from "../lib/notifications";
import { markNotificationsRead } from "../lib/store";

export default function NotificationBell({ state, user, onOpen }) {
  const [open, setOpen] = useState(false);
  const { alerts, updates } = getNotifications(state, user);
  const count = alerts.length + updates.length;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notifications, ${count} new`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="relative rounded-md border border-ink/20 p-2"
      >
        <Bell size={16} aria-hidden="true" />
        {count > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 max-w-[85vw] space-y-3 rounded-md border border-ink/15 bg-white p-3 text-sm shadow-lg">
          {count === 0 && <p className="text-ink/70">You are all caught up.</p>}

          {alerts.length > 0 && (
            <div>
              <p className="mb-1 font-medium">Needs action</p>
              <ul className="space-y-1.5">
                {alerts.map((text) => (
                  <li key={text} className="rounded bg-amber-50 px-2 py-1.5 text-amber-900">{text}</li>
                ))}
              </ul>
            </div>
          )}

          {updates.length > 0 && (
            <div>
              <p className="mb-1 font-medium">Updates</p>
              <ul className="space-y-1.5">
                {updates.map((u) => (
                  <li key={u.id} className="rounded bg-paper px-2 py-1.5">{u.text}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onOpen();
                setOpen(false);
              }}
              className="rounded-md border border-ink/25 px-3 py-1.5"
            >
              Open bookings
            </button>
            {updates.length > 0 && (
              <button type="button" onClick={() => markNotificationsRead(user.id)} className="px-2 text-ink/70 underline">
                Mark updates as read
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
