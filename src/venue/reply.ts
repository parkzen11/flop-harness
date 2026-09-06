// The venue answers a write in text mode with "[<seq>] <ts> <who> <text>", sometimes with a
// tail of the room before it and a "# budget: ..." footer after it. Pick the line that is
// ours (by DID tail), and the last such line, since seq only grows.

export interface WriteReply {
  seq?: number;
  ts?: string;
  budget?: string;
}

const ROW = /^\[(\d+)\]\s+(\S+)/;

export function parseWriteReply(body: string, who?: string): WriteReply {
  const rows = body.split("\n").filter((line) => ROW.test(line));
  const mine = who === undefined ? rows : rows.filter((line) => line.includes(who));
  const pick = (mine.length > 0 ? mine : rows).at(-1);
  const out: WriteReply = {};
  const m = pick === undefined ? null : ROW.exec(pick);
  if (m !== null && m[1] !== undefined && m[2] !== undefined) {
    out.seq = Number(m[1]);
    out.ts = m[2];
  }
  const budget = parseBudgetFooter(body);
  if (budget !== undefined) out.budget = budget;
  return out;
}

export function parseBudgetFooter(body: string): string | undefined {
  const m = /^# budget:.*$/m.exec(body);
  return m === null ? undefined : m[0];
}

/** Strip the venue's "!!" banner lines from a note or room body. */
export function stripBanner(body: string): string {
  return body
    .split("\n")
    .filter((line) => !line.startsWith("!!") && line.trim() !== "")
    .join("\n")
    .trimEnd();
}
