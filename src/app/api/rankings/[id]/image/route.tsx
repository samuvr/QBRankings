import { ImageResponse } from "next/og";
import { getRankingById } from "@/lib/db/client";
import { getQbById } from "@/data/qbs";
import { getTeamByAbbr } from "@/data/teams";
import { getVoting } from "@/data/votings";

export const runtime = "nodejs";

const WIDTH = 1080;
const HEIGHT = 1920;

type Params = Promise<{ id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const ranking = await getRankingById(id);
  if (!ranking) {
    return new Response("Not found", { status: 404 });
  }

  const meta = getVoting(ranking.voting);
  const rows = ranking.positions.map((qbId, idx) => {
    const qb = getQbById(qbId);
    const team = qb ? getTeamByAbbr(qb.teamAbbr) : null;
    return {
      pos: idx + 1,
      name: qb?.name ?? "—",
      teamAbbr: qb?.teamAbbr ?? "??",
      teamColor: team?.primaryColor ?? "#222",
      teamText: team?.secondaryColor ?? "#fff",
    };
  });

  const leftCol = rows.slice(0, 16);
  const rightCol = rows.slice(16, 32);

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: "flex",
          flexDirection: "column",
          background: "#0a0a0f",
          color: "#f5f5f7",
          fontFamily: "system-ui, sans-serif",
          padding: 60,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            paddingBottom: 24,
            borderBottom: `6px solid ${meta.accent}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 110,
              height: 110,
              borderRadius: 999,
              background: meta.accent,
              color: "white",
              fontWeight: 800,
              fontSize: 36,
            }}
          >
            {meta.shortName}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 28, color: "#8a8a99", fontWeight: 600 }}>
              {meta.name} · QB Rankings 2026
            </span>
            <span style={{ fontSize: 56, fontWeight: 900, lineHeight: 1.05 }}>
              Ranking de {ranking.full_name}
            </span>
          </div>
        </div>

        {/* Two columns */}
        <div style={{ display: "flex", gap: 32, marginTop: 32, flex: 1 }}>
          {[leftCol, rightCol].map((col, ci) => (
            <div key={ci} style={{ display: "flex", flexDirection: "column", flex: 1, gap: 10 }}>
              {col.map((r) => (
                <div
                  key={r.pos}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    background: "#14141c",
                    border: "1px solid #2a2a38",
                    borderRadius: 14,
                    padding: "10px 14px",
                    height: 72,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: 50,
                      justifyContent: "center",
                      fontSize: 28,
                      fontWeight: 900,
                      color: "#8a8a99",
                      fontFamily: "monospace",
                    }}
                  >
                    {r.pos.toString().padStart(2, "0")}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 52,
                      height: 52,
                      borderRadius: 999,
                      background: r.teamColor,
                      color: r.teamText,
                      fontSize: 18,
                      fontWeight: 800,
                      border: `2px solid ${r.teamText}`,
                    }}
                  >
                    {r.teamAbbr}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.name}
                    </span>
                    <span style={{ fontSize: 16, color: "#8a8a99" }}>{r.teamAbbr}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 32,
            paddingTop: 18,
            borderTop: "1px solid #2a2a38",
            color: "#8a8a99",
            fontSize: 22,
            fontWeight: 500,
          }}
        >
          <span>Haz tu propio top 32</span>
          <span style={{ fontWeight: 700, color: "#f5f5f7" }}>qbrankings.app</span>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },
  );
}
