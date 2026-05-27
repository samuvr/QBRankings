"use client";

import Image from "next/image";
import { useState } from "react";
import { getTeamByAbbr, teamLogoUrl } from "@/data/teams";

type Props = {
  abbr: string;
  size?: number;
};

export function TeamMark({ abbr, size = 40 }: Props) {
  const team = getTeamByAbbr(abbr);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full font-bold"
        style={{
          background: team.primaryColor,
          color: team.secondaryColor,
          width: size,
          height: size,
          fontSize: size * 0.32,
          border: `2px solid ${team.secondaryColor}`,
        }}
        aria-label={`${team.location} ${team.name}`}
      >
        {abbr}
      </div>
    );
  }

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={`${team.location} ${team.name}`}
    >
      <Image
        src={teamLogoUrl(abbr)}
        alt={`${team.location} ${team.name}`}
        fill
        sizes={`${size}px`}
        className="object-contain"
        onError={() => setFailed(true)}
        unoptimized
      />
    </div>
  );
}
