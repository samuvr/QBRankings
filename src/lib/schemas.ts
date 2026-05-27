import { z } from "zod";
import { getQbIds, TOTAL_QBS } from "@/data/qbs";
import { VOTING_IDS } from "@/data/votings";

const QB_ID_SET = new Set(getQbIds());

// Normaliza a Title Case: minúsculas + capitaliza tras espacio, guión o apóstrofo.
// Maneja acentos (à-ÿ): "ANTONIO ANTON TOME" → "Antonio Anton Tome",
// "o'brien" → "O'Brien", "jean-pierre" → "Jean-Pierre", "garcía" → "García".
function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|[\s\-'])([a-zà-ÿ])/g, (_m, sep, ch) => sep + ch.toUpperCase());
}

export const RankingSubmissionSchema = z.object({
  fullName: z.string().trim().min(2).max(30).transform(toTitleCase),
  email: z.string().trim().toLowerCase().email().max(200),
  voting: z.enum(VOTING_IDS),
  positions: z
    .array(z.string())
    .length(TOTAL_QBS)
    .refine((arr) => new Set(arr).size === arr.length, {
      message: "positions must contain unique QB ids",
    })
    .refine((arr) => arr.every((id) => QB_ID_SET.has(id)), {
      message: "positions contains an unknown QB id",
    }),
});

export type RankingSubmission = z.infer<typeof RankingSubmissionSchema>;

export const AdminLoginSchema = z.object({
  password: z.string().min(1).max(200),
});
