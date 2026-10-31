import { useState } from "react";
import Dialog from "./Dialog";
import { reportIncident } from "../lib/store";

const TYPES = { damage: "Damage", delay: "Delay or no-show", other: "Something else" };

export default function IncidentDialog({ booking, resource, user, onClose }) {
  const [type, setType] = useState("damage");
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    const result = reportIncident(booking.id, user.id, type, text);
    if (result.ok) onClose();
    else setError(result.error);
  }

  return (
    <Dialog title={`Report a problem: ${resource.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-medium">
          What kind of problem?
          <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 w-full rounded-md border border-ink/20 bg-white px-3 py-2 text-sm">
            {Object.entries(TYPES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          What happened?
          <textarea
            rows={4}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError("");
            }}
            className="mt-1 w-full rounded-md border border-ink/20 px-3 py-2 text-sm"
          />
        </label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-ink/20 px-4 py-2 text-sm">
            Cancel
          </button>
          <button type="submit" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white">
            Send report
          </button>
        </div>
      </form>
    </Dialog>
  );
}
