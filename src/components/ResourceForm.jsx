import { useState } from "react";
import Dialog from "./Dialog";
import { addResource, CATEGORIES } from "../lib/store";
import { certifications } from "../data/seed";

const field = "mt-1 w-full rounded-md border border-ink/20 bg-white px-3 py-2 text-sm";

export default function ResourceForm({ user, onClose }) {
  const [form, setForm] = useState({
    name: "",
    category: CATEGORIES[0],
    location: "",
    availability: "",
    maxHours: 2,
    deposit: 0,
    requires: [],
    rules: "",
  });
  const [errors, setErrors] = useState([]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const toggleCert = (id) =>
    setForm({
      ...form,
      requires: form.requires.includes(id) ? form.requires.filter((x) => x !== id) : [...form.requires, id],
    });

  function submit(e) {
    e.preventDefault();
    const result = addResource(user.id, form);
    if (result.ok) onClose();
    else setErrors(result.errors);
  }

  return (
    <Dialog title="List a resource" onClose={onClose}>
      <form onSubmit={submit} noValidate className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
        <label className="block text-sm font-medium">
          Name
          <input value={form.name} onChange={set("name")} className={field} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium">
            Category
            <select value={form.category} onChange={set("category")} className={field}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Location
            <input value={form.location} onChange={set("location")} className={field} />
          </label>
        </div>

        <label className="block text-sm font-medium">
          When is it available?
          <input value={form.availability} onChange={set("availability")} placeholder="Mon to Fri, 10:00 to 16:00" className={field} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium">
            Longest booking (hours)
            <input type="number" min="0.5" step="0.5" value={form.maxHours} onChange={set("maxHours")} className={field} />
          </label>
          <label className="block text-sm font-medium">
            Refundable deposit (₹)
            <input type="number" min="0" value={form.deposit} onChange={set("deposit")} className={field} />
          </label>
        </div>

        <fieldset>
          <legend className="text-sm font-medium">Training or qualification required</legend>
          <div className="mt-2 space-y-1.5">
            {certifications.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.requires.includes(c.id)} onChange={() => toggleCert(c.id)} />
                {c.name}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block text-sm font-medium">
          Usage rules
          <textarea rows={3} value={form.rules} onChange={set("rules")} className={field} />
        </label>

        {errors.length > 0 && (
          <ul role="alert" className="list-disc space-y-1 rounded-md border border-red-200 bg-red-50 py-3 pl-8 pr-3 text-sm text-red-800">
            {errors.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-md border border-ink/20 px-4 py-2 text-sm">
            Cancel
          </button>
          <button type="submit" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white">
            List resource
          </button>
        </div>
      </form>
    </Dialog>
  );
}
