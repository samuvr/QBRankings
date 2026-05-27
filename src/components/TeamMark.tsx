import { getTeamByAbbr } from "@/data/teams";

type Props = {
  abbr: string;
  size?: number;
};

export function TeamMark({ abbr, size = 40 }: Props) {
  const team = getTeamByAbbr(abbr);
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full text-white font-bold"
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
