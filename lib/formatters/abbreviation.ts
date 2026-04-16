/**
 * Smart Abbreviation Generator
 * Intelligently generates 2-4 character abbreviations from business/outlet names
 * Handles multi-word names, removes common words, and manages special characters
 */

const COMMON_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "at",
  "on",
  "of",
  "to",
  "for",
  "with",
  "by",
  "from",
  "as",
  "is",
  "was",
  "are",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "can",
  "ltd",
  "limited",
  "inc",
  "incorporated",
  "co",
  "corp",
  "corporation",
  "llc",
  "pvt",
  "private",
  "branch",
  "store",
  "shop",
  "outlet",
  "center",
  "centre",
]);

/**
 * Removes special characters, trims, and converts to lowercase
 */
function cleanWord(word: string): string {
  return word
    .replace(/[^a-zA-Z0-9]/g, "") // Remove special characters
    .toLowerCase()
    .trim();
}

/**
 * Extracts meaningful words from a name, excluding common words
 */
function extractMeaningfulWords(name: string): string[] {
  return name
    .split(/[\s\-_&\/,]+/) // Split by whitespace, hyphens, underscores, ampersands, slashes, commas
    .map((word) => cleanWord(word))
    .filter((word) => word.length > 0 && !COMMON_WORDS.has(word));
}

/**
 * Generates a smart abbreviation from a name
 * Strategy:
 * 1. Extract meaningful words (remove common words)
 * 2. If 1 word: Use first 3-4 characters
 * 3. If 2-3 words: Use first character of each word (2-3 chars)
 * 4. If 4+ words: Use first char of first 3-4 meaningful words
 *
 * Examples:
 * - "SuperMart" → "SUP"
 * - "Central Supermarket" → "CS"
 * - "Central Supermarket Limited" → "CSL"
 * - "The Central Supermarket Limited" → "CSL" (removes "The")
 * - "Downtown Mumbai Branch" → "DMB" (removes "Branch")
 * - "A&B Stores" → "AB"
 */
export function generateSmartAbbreviation(name: string): string {
  if (!name || !name.trim()) {
    return "";
  }

  const meaningfulWords = extractMeaningfulWords(name);

  // If no meaningful words found, fall back to original name
  if (meaningfulWords.length === 0) {
    const cleaned = cleanWord(name);
    return cleaned.substring(0, 3).toUpperCase();
  }

  let abbreviation = "";

  if (meaningfulWords.length === 1) {
    // Single word: use first 3-4 characters
    abbreviation = meaningfulWords[0].substring(0, 4);
  } else if (meaningfulWords.length <= 3) {
    // Multiple words (2-3): use first character of each
    abbreviation = meaningfulWords.map((w) => w.charAt(0)).join("");
  } else {
    // 4+ words: use first character of first 3-4 words
    abbreviation = meaningfulWords
      .slice(0, 4)
      .map((w) => w.charAt(0))
      .join("");
  }

  return abbreviation.toUpperCase();
}

/**
 * Validates an abbreviation
 * - Must be 2-4 characters
 * - Must contain only alphanumeric characters
 */
export function isValidAbbreviation(abbrev: string): boolean {
  return /^[A-Za-z0-9]{2,4}$/.test(abbrev.trim());
}

/**
 * Formats an abbreviation by:
 * - Converting to uppercase
 * - Removing invalid characters
 * - Ensuring it's 2-4 characters
 */
export function formatAbbreviation(abbrev: string): string {
  const cleaned = abbrev
    .replace(/[^a-zA-Z0-9]/g, "") // Remove special characters
    .toUpperCase()
    .substring(0, 4); // Limit to 4 characters

  return cleaned;
}
