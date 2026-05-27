"use client";

import type { VotingPublic } from "@/lib/db/client";

type Props = {
  value: string | null;
  onChange: (id: string) => void;
  votings: VotingPublic[];
};

export function VotingSelector({ value, onChange, votings }: Props) {
  if (votings.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-surface p-4 text-center text-xs text-muted">
        No hay votaciones activas.
      </p>
    );
  }
  return (
    <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <legend className="sr-only">Selecciona votación</legend>
      {votings.map((v) => {
        const selected = value === v.id;
        return (
          <label
            key={v.id}
            className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border p-5 text-center transition active:scale-[0.98] ${
              selected
                ? "border-foreground bg-surface-2 shadow-[0_0_0_2px_var(--color-foreground)]"
                : "border-border bg-surface hover:border-muted"
            }`}
            style={selected ? { borderColor: v.accent, boxShadow: `0 0 0 2px ${v.accent}` } : undefined}
          >
            <input
              type="radio"
              name="voting"
              value={v.id}
              checked={selected}
              onChange={() => onChange(v.id)}
              className="sr-only"
            />
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full font-bold text-white"
              style={{ background: v.accent }}
            >
              {v.short_name}
            </div>
            <div>
              <p className="text-base font-semibold">{v.name}</p>
              <p className="text-xs text-muted">{v.description}</p>
            </div>
          </label>
        );
      })}
    </fieldset>
  );
}
