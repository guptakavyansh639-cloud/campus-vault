import { useState } from "react";
import Dialog from "./Dialog";
import { checkIn, returnItem } from "../lib/store";
import { CONDITIONS } from "../lib/rules";

export default function ConditionDialog({ mode, booking, resource, user, onClose }) {
  const [condition, setCondition] = useState("good");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const isReturn = mode === "return";

  function submit(e) {
    e.preventDefault();
    if ((condition === "worn" || condition === "damaged") && !notes.trim()) {
      setError("Describe the wear or damage so the record is clear.");
      return;
    }
    if (isReturn) returnItem(booking.id, user.id, condition, notes);
    else checkIn(booking.id, user.id, condition, notes);
    onClose();
  }

  return (
    <Dialog title={`${isReturn ? "Return" : "Check in"}: ${resource.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {isReturn && (
          <p className="text-sm text-ink/70">
            Condition when you checked in: <strong>{CONDITIONS[booking.checkIn.condition]}</strong>
          </p>
        )}

        <fieldset>
          <legend className="text-sm font-medium">
            {isReturn ? "Condition now" : "Condition when you receive it"}
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {Object.entries(CONDITIONS).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 rounded-md border border-ink/20 px-3 py-2 text-sm">
                <input type="radio" name="condition" value={key} checked={condition === key} onChange={() => setCondition(key)} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block text-sm font-medium">
          Notes (required for minor wear or damage)
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
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
            {isReturn ? "Confirm return" : "Confirm check-in"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
