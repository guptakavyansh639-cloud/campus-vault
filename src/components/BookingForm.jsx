import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { requestBooking } from "../lib/store";
import { FAIR_USE_LIMIT } from "../lib/rules";

function todayString() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const field = "mt-1 w-full rounded-md border border-ink/20 bg-white px-3 py-2 text-sm";

export default function BookingForm({ resource, user, onClose, onDone }) {
  const [form, setForm] = useState({ date: "", start: "10:00", hours: 1, purpose: "" });
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  function submit(e) {
    e.preventDefault();
    const result = requestBooking(user.id, resource.id, form);
    if (result.ok) onDone(result.booking);
    else setErrors(result.errors);
  }

  return (
    <div className="fixed inset-0 z-10 grid place-items-center bg-ink/50 p-4" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        noValidate
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-md bg-white p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="booking-title" className="text-lg font-semibold">Request {resource.name}</h2>
            <p className="text-sm text-ink/70">{resource.location}. {resource.availability}.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-ink/60 hover:text-ink">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-medium">
            Date
            <input type="date" min={todayString()} value={form.date} onChange={set("date")} className={field} />
          </label>
          <label className="text-sm font-medium">
            Start time
            <input type="time" value={form.start} onChange={set("start")} className={field} />
          </label>
        </div>

        <label className="block text-sm font-medium">
          Hours needed (up to {resource.maxHours})
          <input type="number" min="0.5" step="0.5" value={form.hours} onChange={set("hours")} className={field} />
        </label>

        <label className="block text-sm font-medium">
          What will you use it for?
          <textarea rows={3} value={form.purpose} onChange={set("purpose")} className={field} />
        </label>

        <p className="text-sm text-ink/70">
          Fair use: you can hold up to {FAIR_USE_LIMIT} active bookings at once. If the time is already taken, you join the waiting list.
        </p>

        {errors.length > 0 && (
          <ul role="alert" className="list-disc space-y-1 rounded-md border border-red-200 bg-red-50 py-3 pl-8 pr-3 text-sm text-red-800">
            {errors.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-ink/20 px-4 py-2 text-sm">
            Cancel
          </button>
          <button type="submit" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white">
            Send request
          </button>
        </div>
      </form>
    </div>
  );
}
