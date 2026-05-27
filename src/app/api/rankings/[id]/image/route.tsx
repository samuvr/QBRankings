import { ImageResponse } from "next/og";
import { getRankingById } from "@/lib/db/client";
import { getQbById } from "@/data/qbs";
import { getTeamByAbbr, teamLogoUrl } from "@/data/teams";
import { getVoting } from "@/data/votings";

export const runtime = "nodejs";

const WIDTH = 1080;
const HEIGHT = 1920;

// NFL Alicante palette
const BG = "#F4EEDC";
const FG = "#0A2240";
const ACCENT = "#C8102E";
const SURFACE = "#FBF7E8";
const SURFACE_2 = "#ECE3C7";
const BORDER = "rgba(10, 34, 64, 0.18)";
const MUTED = "rgba(10, 34, 64, 0.6)";

type Params = Promise<{ id: string }>;

// Carga fuentes desde el CDN de Google Fonts.
// Next cachea la respuesta por defecto en runtime nodejs.
async function loadFont(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Failed to load font: ${url}`);
  return await res.arrayBuffer();
}

async function loadFonts() {
  const [display, subhead, body, bodyBold, mono] = await Promise.all([
    loadFont("https://fonts.gstatic.com/s/anton/v25/1Ptgg87LROyAm0K08i4gS7lu.ttf"),
    loadFont("https://fonts.gstatic.com/s/archivoblack/v21/HTxqL289NzCGg4MzN6KJ7eW6CYyF_g.ttf"),
    loadFont("https://fonts.gstatic.com/s/inter/v19/UcCO3FwrK3iLTeHuS_nVMrMxCp50ojIw2boKoduKmMEVuLyfMZg.ttf"),
    loadFont("https://fonts.gstatic.com/s/inter/v19/UcCO3FwrK3iLTeHuS_nVMrMxCp50ojIw2boKoduKmMEVuI6fMZg.ttf"),
    loadFont("https://fonts.gstatic.com/s/jetbrainsmono/v22/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.ttf"),
  ]);
  return [
    { name: "Anton", data: display, weight: 400 as const, style: "normal" as const },
    { name: "ArchivoBlack", data: subhead, weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: body, weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: bodyBold, weight: 700 as const, style: "normal" as const },
    { name: "JetBrainsMono", data: mono, weight: 400 as const, style: "normal" as const },
  ];
}

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
      logoUrl: qb ? teamLogoUrl(qb.teamAbbr) : null,
    };
  });

  const leftCol = rows.slice(0, 16);
  const rightCol = rows.slice(16, 32);

  const fonts = await loadFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: "flex",
          flexDirection: "column",
          background: BG,
          color: FG,
          fontFamily: "Inter",
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
            borderBottom: `6px solid ${ACCENT}`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img
            src={meta.logoUrl.startsWith("http")
              ? meta.logoUrl
              : `${process.env.NEXT_PUBLIC_APP_URL ?? "https://qb-rankings.vercel.app"}${meta.logoUrl}`}
            width={120}
            height={120}
            style={{ borderRadius: 999, objectFit: "cover", border: `3px solid ${FG}` }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontFamily: "ArchivoBlack",
                fontSize: 24,
                color: ACCENT,
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              {meta.name} · 2026
            </span>
            <span
              style={{
                fontFamily: "Anton",
                fontSize: 80,
                lineHeight: 0.95,
                textTransform: "uppercase",
                color: FG,
              }}
            >
              Ranking de
            </span>
            <span
              style={{
                fontFamily: "Anton",
                fontSize: 64,
                lineHeight: 1,
                textTransform: "uppercase",
                color: FG,
              }}
            >
              {ranking.full_name}
            </span>
          </div>
        </div>

        {/* Two columns */}
        <div style={{ display: "flex", gap: 24, marginTop: 28, flex: 1 }}>
          {[leftCol, rightCol].map((col, ci) => (
            <div key={ci} style={{ display: "flex", flexDirection: "column", flex: 1, gap: 8 }}>
              {col.map((r) => (
                <div
                  key={r.pos}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    background: SURFACE,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 14,
                    padding: "8px 14px",
                    height: 72,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: 56,
                      justifyContent: "center",
                      fontFamily: "JetBrainsMono",
                      fontSize: 30,
                      color: FG,
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
                    }}
                  >
                    {r.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
                      <img
                        src={r.logoUrl}
                        width={52}
                        height={52}
                        style={{ objectFit: "contain" }}
                      />
                    ) : (
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
                          fontFamily: "Inter",
                          fontSize: 18,
                          fontWeight: 700,
                          border: `2px solid ${r.teamText}`,
                        }}
                      >
                        {r.teamAbbr}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        fontFamily: "Inter",
                        fontWeight: 700,
                        fontSize: 24,
                        color: FG,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.name}
                    </span>
                    <span
                      style={{ fontFamily: "JetBrainsMono", fontSize: 16, color: MUTED }}
                    >
                      {r.teamAbbr}
                    </span>
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
            alignItems: "center",
            marginTop: 28,
            paddingTop: 18,
            borderTop: `1px solid ${BORDER}`,
            color: MUTED,
            fontFamily: "ArchivoBlack",
            fontSize: 22,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          <span>Haz tu propio top 32</span>
          <span style={{ color: ACCENT }}>{meta.name}</span>
        </div>

        {/* Bottom strip with surface_2 (unused but keeps palette balanced) */}
        <div style={{ display: "none", background: SURFACE_2 }} />
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },
  );
}
