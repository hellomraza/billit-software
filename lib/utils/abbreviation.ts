/**
 * Generate business/outlet abbreviation from name
 * Algorithm:
 * - If 2+ words: take first letter of each word
 * - If 1 word: take first 3 characters
 * - Pad to minimum 3 chars using first word
 * - Truncate to max 6 chars
 * - Always uppercase
 */
export function generateAbbreviation(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9 ]/g, "").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);

  let abbr = "";

  // If 2+ words, take first letter of each
  if (words.length >= 2) {
    abbr = words.map((w) => w[0]).join("");
  } else if (words.length === 1) {
    // If 1 word, take first 3 characters
    abbr = words[0].substring(0, 3);
  }

  // Pad to minimum 3 chars using first word
  if (abbr.length < 3 && words[0]) {
    abbr = (abbr + words[0]).substring(0, 3);
  }

  // Truncate to max 6 chars
  abbr = abbr.substring(0, 6).toUpperCase();

  return abbr;
}
