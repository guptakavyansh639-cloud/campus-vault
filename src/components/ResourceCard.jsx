import {
  Printer, Camera, Cpu, Activity, Plane, Presentation,
  MapPin, Clock, Wallet, Check, X, BadgeCheck,
} from "lucide-react";
import { checkEligibility, certName } from "../lib/rules";

const ICONS = {
  printer: Printer,
  camera: Camera,
  cpu: Cpu,
  scope: Activity,
  drone: Plane,
  room: Presentation,
};

export default function ResourceCard({ resource, owner, user, onRequest }) {
  const Icon = ICONS[resource.icon] ?? Cpu;
  const isStudent = user.role === "student";
  const { eligible, missing } = checkEligibility(user, resource);
  const have = new Set(user.certs);

  return (
    <article className="flex flex-col rounded-md border border-ink/15 bg-white">
      {/* Asset-tag strip, like the sticker on real lab equipment */}
      <div className="flex items-center justify-between border-b border-dashed border-ink/20 px-4 py-2 text-xs text-ink/60">
        <span className="tabular-nums">{resource.code}</span>
        <span>{resource.category}</span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded bg-accent/10 text-accent">
            <Icon size={20} aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold leading-snug">{resource.name}</h3>
            <p className="flex items-center gap-1 text-sm text-ink/70">
              Managed by {owner?.name}
              {owner?.verified && <BadgeCheck size={14} className="text-accent" aria-label="Verified owner" />}
            </p>
          </div>
        </div>

        <ul className="space-y-1.5 text-sm text-ink/80">
          <li className="flex items-center gap-2">
            <MapPin size={15} aria-hidden="true" /> {resource.location}
          </li>
          <li className="flex items-center gap-2">
            <Clock size={15} aria-hidden="true" /> {resource.availability}, up to {resource.maxHours} h per booking
          </li>
          <li className="flex items-center gap-2">
            <Wallet size={15} aria-hidden="true" />
            {resource.deposit > 0 ? `Refundable deposit ₹${resource.deposit}` : "No deposit"}
          </li>
        </ul>

        <div className="text-sm">
          <p className="mb-1 font-medium">Requirements</p>
          {resource.requires.length === 0 ? (
            <p className="text-ink/70">No training needed</p>
          ) : (
            <ul className="space-y-1">
              {resource.requires.map((id) => {
                const ok = have.has(id);
                return (
                  <li key={id} className="flex items-center gap-2">
                    {isStudent ? (
                      ok ? (
                        <Check size={15} className="text-emerald-700" aria-label="You have this" />
                      ) : (
                        <X size={15} className="text-red-700" aria-label="You are missing this" />
                      )
                    ) : (
                      <span className="size-1.5 rounded-full bg-ink/40" aria-hidden="true" />
                    )}
                    <span>{certName(id)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <p className="text-sm text-ink/70">{resource.rules}</p>
      </div>

      {isStudent && (
        <div
          className={`flex items-center justify-between gap-3 border-t px-4 py-3 text-sm ${
            eligible ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <span className="font-medium">
            {eligible ? "You meet all requirements" : `Missing: ${missing.map(certName).join(", ")}`}
          </span>
          <button
            type="button"
            disabled={!eligible}
            onClick={() => onRequest(resource)}
            className="shrink-0 rounded-md bg-accent px-3 py-1.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Request booking
          </button>
        </div>
      )}
    </article>
  );
}
