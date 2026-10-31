import { useState } from "react";
import { Search, RotateCcw, Plus } from "lucide-react";
import { useStore, switchUser, resetDemo } from "./lib/store";
import ResourceCard from "./components/ResourceCard";
import ActivityLog from "./components/ActivityLog";
import BookingForm from "./components/BookingForm";
import Bookings from "./components/Bookings";
import ResourceForm from "./components/ResourceForm";
import NotificationBell from "./components/NotificationBell";

function Browse({ resources, users, user, onRequest, onList }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = ["All", ...new Set(resources.map((r) => r.category))];

  const shown = resources.filter((r) => {
    const matchesCategory = category === "All" || r.category === category;
    const text = `${r.name} ${r.location} ${r.category}`.toLowerCase();
    return matchesCategory && text.includes(query.toLowerCase());
  });

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Find equipment and spaces</h2>
        {user.role === "owner" && (
          <button type="button" onClick={onList} className="flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-medium text-white">
            <Plus size={16} aria-hidden="true" /> List a resource
          </button>
        )}
      </div>

      <div className="mb-5 mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative block sm:w-72">
          <span className="sr-only">Search resources</span>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/50" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or location"
            className="w-full rounded-md border border-ink/20 bg-white py-2 pl-9 pr-3 text-sm"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={`rounded-full border px-3 py-1 text-sm ${
                category === c
                  ? "border-accent bg-accent text-white"
                  : "border-ink/20 bg-white hover:border-ink/40"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-md border border-dashed border-ink/25 p-6 text-sm text-ink/70">
          No resources match. Try a different word or choose All.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              owner={users.find((u) => u.id === r.ownerId)}
              user={user}
              onRequest={onRequest}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function App() {
  const s = useStore();
  const [tab, setTab] = useState("browse");
  const [requesting, setRequesting] = useState(null);
  const [listing, setListing] = useState(false);
  const user = s.users.find((u) => u.id === s.currentUserId);

  const tabs = [
    { id: "browse", label: "Browse resources" },
    { id: "bookings", label: "Bookings" },
    { id: "activity", label: "Activity log" },
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink/15 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <h1 className="text-lg font-semibold tracking-tight">Campus Vault</h1>

          <div className="flex items-center gap-3 text-sm">
            <NotificationBell state={s} user={user} onOpen={() => setTab("bookings")} />
            <label className="flex items-center gap-2">
              <span className="text-ink/70">Demo account</span>
              <select
                value={s.currentUserId}
                onChange={(e) => switchUser(e.target.value)}
                className="rounded-md border border-ink/20 bg-white px-2 py-1.5"
              >
                {s.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <nav className="mx-auto flex max-w-6xl gap-1 px-4" aria-label="Main">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
                tab === t.id ? "border-accent text-accent" : "border-transparent text-ink/70 hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {tab === "browse" && <Browse resources={s.resources} users={s.users} user={user} onRequest={setRequesting} onList={() => setListing(true)} />}
        {tab === "bookings" && <Bookings bookings={s.bookings} resources={s.resources} users={s.users} incidents={s.incidents} audit={s.audit} user={user} />}
        {tab === "activity" && <ActivityLog audit={s.audit} users={s.users} user={user} />}
      </main>

      {requesting && (
        <BookingForm
          resource={requesting}
          user={user}
          onClose={() => setRequesting(null)}
          onDone={() => {
            setRequesting(null);
            setTab("bookings");
          }}
        />
      )}

      {listing && <ResourceForm user={user} onClose={() => setListing(false)} />}

      <footer className="mx-auto max-w-6xl px-4 pb-8">
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Reset all demo data back to the starting state?")) resetDemo();
          }}
          className="flex items-center gap-2 text-sm text-ink/60 hover:text-ink"
        >
          <RotateCcw size={14} aria-hidden="true" /> Reset demo data
        </button>
      </footer>
    </div>
  );
}
