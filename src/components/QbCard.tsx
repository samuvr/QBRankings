"use client";

import { type Qb } from "@/data/qbs";
import { TeamMark } from "./TeamMark";

type Props = {
  qb: Qb;
  onTap?: () => void;
  disabled?: boolean;
  compact?: boolean;
};

export function QbCard({ qb, onTap, disabled, compact }: Props) {
  const content = (
    <>
      <TeamMark abbr={qb.teamAbbr} size={compact ? 36 : 44} />
      <div className="min-w-0 flex-1 text-left">
        <p className={`truncate font-semibold ${compact ? "text-sm" : "text-base"}`}>{qb.name}</p>
        <p className="truncate text-xs text-muted">{qb.teamAbbr}</p>
      </div>
    </>
  );

  if (!onTap) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onTap}
      disabled={disabled}
      className={`flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2 text-left transition active:scale-[0.98] hover:border-muted disabled:opacity-40 disabled:active:scale-100`}
    >
      {content}
    </button>
  );
}
