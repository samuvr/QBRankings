"use client";

import { VOTINGS, type VotingId } from "@/data/votings";

type Props = {
  value: VotingId | null;
  onChange: (id: VotingId) => void;
};

export function VotingSelector({ value, onChange }: Props) {
  return (
    <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <legend className="sr-only">Selecciona votación</legend>
      {Object.values(VOTINGS).map((v) => {
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
              {v.shortName}
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
