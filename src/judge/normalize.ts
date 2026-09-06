/** Lowercase, keep letters/digits/`.`/`,`, collapse whitespace. Same as the donor judge. */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9., ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Reference tokens worth matching: 2+ chars, split on spaces and commas. */
export function referenceTokens(answer: string): string[] {
  return normalizeText(answer)
    .split(/[ ,]+/)
    .filter((token) => token.length >= 2);
}
