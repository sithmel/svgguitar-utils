//@ts-check

// ASCII format characters
const ASCII_VERTICAL = "|";
const ASCII_OPEN = "o";
const ASCII_MUTED = "x";
const ASCII_ROOT = "*";

// Unicode format characters
const UNICODE_VERTICAL = "│";
const UNICODE_OPEN = "○";
const UNICODE_MUTED = "×";
const UNICODE_ROOT = "●";

// Unicode box drawing characters for grid detection
// Includes both double-line (╒═╤╕) and light (┌─┬┐) box-drawing sets
const UNICODE_BOX_CHARS = "╒═╤╕├─┼┤└┴┘┌┬┐";

/**
 * Detect if the string uses Unicode format
 * @param {string} str
 * @returns {boolean}
 */
function isUnicodeFormat(str) {
  return (
    str.includes(UNICODE_VERTICAL) ||
    str.includes(UNICODE_OPEN) ||
    str.includes(UNICODE_ROOT) ||
    str.includes(UNICODE_MUTED) ||
    [...UNICODE_BOX_CHARS].some(c => str.includes(c))
  );
}

/**
 * Find grid boundaries for Unicode format
 * Unicode grids use box-drawing characters with consistent spacing.
 * The grid line looks like: ╒═╤═╤═╤═╤═╕ or │ │ │ │ │ │
 * Separators are at even positions, cells (where notes go) are at odd positions.
 * @param {string[]} lines
 * @param {number} firstGridRowIdx
 * @returns {{ startCol: number, endCol: number, numStrings: number }}
 */
function findUnicodeGridBoundaries(lines, firstGridRowIdx) {
  let minPos = Infinity;
  let maxPos = -1;

  // Scan all grid lines to find the full extent
  for (let i = firstGridRowIdx; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === UNICODE_VERTICAL || "╒╤╕├┼┤└┴┘═─┌┬┐".includes(char)) {
        if (j < minPos) minPos = j;
        if (j > maxPos) maxPos = j;
      }
    }
  }

  if (minPos === Infinity || maxPos === -1) {
    return { startCol: 0, endCol: 0, numStrings: 0 };
  }

  // In Unicode format, grid cells are spaced every 2 characters
  // For a grid spanning positions 2-12 (width 11), we have 6 positions: 2,4,6,8,10,12
  // Which maps to 6 strings
  const numStrings = Math.floor((maxPos - minPos) / 2) + 1;
  return { startCol: minPos, endCol: maxPos, numStrings };
}

/**
 * Map a character position to a string number for Unicode format (1-6, right to left)
 * @param {number} charPos - Character position in the line
 * @param {number} startCol - Start column of the grid
 * @param {number} numStrings - Number of strings
 * @returns {number} String number (1-6) or -1 if out of bounds
 */
function unicodeCharPosToStringNum(charPos, startCol, numStrings) {
  // In Unicode format, positions are at startCol, startCol+2, startCol+4, etc.
  const offset = charPos - startCol;
  if (offset < 0 || offset % 2 !== 0) return -1;
  const idx = offset / 2;
  if (idx >= numStrings) return -1;
  // String 6 is at idx 0, string 1 is at idx (numStrings - 1)
  return numStrings - idx;
}

/**
 * Find grid boundaries for ASCII format
 * @param {string[]} lines
 * @param {number} firstGridRowIdx
 * @returns {{ startCol: number, endCol: number, numStrings: number }}
 */
function findAsciiGridBoundaries(lines, firstGridRowIdx) {
  let minPos = Infinity;
  let maxPos = -1;

  // Scan all grid lines to find the full extent of the grid
  for (let i = firstGridRowIdx; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      if (line[j] === ASCII_VERTICAL) {
        if (j < minPos) minPos = j;
        if (j > maxPos) maxPos = j;
      }
    }
  }

  if (minPos === Infinity || maxPos === -1) {
    return { startCol: 0, endCol: 0, numStrings: 0 };
  }

  // Number of strings is the span from minPos to maxPos inclusive
  const numStrings = maxPos - minPos + 1;
  return { startCol: minPos, endCol: maxPos, numStrings };
}

/**
 * Map a character position to a string number for ASCII format (1-6, right to left)
 * @param {number} charPos - Character position in the line
 * @param {number} startCol - Start column of the grid
 * @param {number} numStrings - Number of strings (typically 6)
 * @returns {number} String number (1-6) or -1 if out of bounds
 */
function asciiCharPosToStringNumber(charPos, startCol, numStrings) {
  const offset = charPos - startCol;
  if (offset < 0 || offset >= numStrings) return -1;
  // String 6 is at offset 0, string 1 is at offset (numStrings - 1)
  return numStrings - offset;
}

/**
 * Check if a line is a grid row (contains content, not just separators)
 * @param {string} line
 * @param {boolean} isUnicode
 * @returns {boolean}
 */
function isGridRow(line, isUnicode) {
  if (isUnicode) {
    // For Unicode, look for box drawing characters or vertical bars
    let count = 0;
    for (const char of line) {
      if (char === UNICODE_VERTICAL || "╒╤╕├┼┤└┴┘┌┬┐".includes(char)) count++;
    }
    return count >= 2;
  } else {
    // For ASCII, count pipe characters
    let count = 0;
    for (const char of line) {
      if (char === ASCII_VERTICAL) count++;
    }
    return count >= 2;
  }
}

/**
 * Check if a Unicode line is a fret content row (has │) vs separator row (has ├, ─, etc.)
 * @param {string} line
 * @returns {boolean}
 */
function isUnicodeFretRow(line) {
  // Fret rows contain │ (vertical bar with content), not just ├┼┤ (horizontal connectors)
  return line.includes(UNICODE_VERTICAL);
}

/**
 * Parse a string representation of a guitar fingering into internal format
 * @param {string} fingeringStr - The string representation of the fingering
 * @param {{ redColor?: string, blackColor?: string }} [options]
 * @returns {import("svguitar").Chord} The parsed fingering object
 */
export default function stringToFingering(fingeringStr, options = {}) {
  const { redColor = "#e74c3c", blackColor = "#000000" } = options;

  if (!fingeringStr || fingeringStr.trim() === "") {
    return { fingers: [], barres: [] };
  }

  const lines = fingeringStr.split("\n");
  const isUnicode = isUnicodeFormat(fingeringStr);

  const openChar = isUnicode ? UNICODE_OPEN : ASCII_OPEN;
  const mutedChar = isUnicode ? UNICODE_MUTED : ASCII_MUTED;
  const rootChar = isUnicode ? UNICODE_ROOT : ASCII_ROOT;

  /** @type {import("svguitar").Finger[]} */
  const fingers = [];
  /** @type {string | undefined} */
  let title;
  /** @type {number | undefined} */
  let position;

  // Find the first grid row
  let firstGridRowIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (isGridRow(lines[i], isUnicode)) {
      firstGridRowIdx = i;
      break;
    }
  }

  if (firstGridRowIdx === -1) {
    // No valid grid found
    return { fingers: [], barres: [] };
  }

  // Get column mapping based on format
  let startCol = 0;
  let numStrings = 6;

  if (isUnicode) {
    const bounds = findUnicodeGridBoundaries(lines, firstGridRowIdx);
    startCol = bounds.startCol;
    numStrings = bounds.numStrings;
    if (numStrings === 0) {
      return { fingers: [], barres: [] };
    }
    // Check if first grid row uses ╒═╤ pattern (indicates position = 1)
    const firstGridLine = lines[firstGridRowIdx];
    if (firstGridLine.includes("╒") && firstGridLine.includes("═")) {
      position = 1;
    }
  } else {
    const bounds = findAsciiGridBoundaries(lines, firstGridRowIdx);
    startCol = bounds.startCol;
    numStrings = bounds.numStrings;
    if (numStrings === 0) {
      return { fingers: [], barres: [] };
    }
  }

  /**
   * Get string number for a character position
   * @param {number} charPos
   * @returns {number}
   */
  const getStringNumber = (charPos) => {
    if (isUnicode) {
      return unicodeCharPosToStringNum(charPos, startCol, numStrings);
    } else {
      return asciiCharPosToStringNumber(charPos, startCol, numStrings);
    }
  };

  // Parse title from lines before the grid
  // Title is the first non-empty line that doesn't contain grid/indicator characters
  for (let i = 0; i < firstGridRowIdx; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed === "") continue;
    // Check if this line contains only indicator characters (o, x, ○, ×, spaces)
    const indicatorPattern = isUnicode
      ? /^[\s○×0-9]*$/
      : /^[\s oxOX0-9]*$/;
    if (!indicatorPattern.test(trimmed)) {
      title = trimmed;
      break;
    }
  }

  // If no title found, set to empty string
  if (title === undefined) {
    title = "";
  }

  // Parse open/muted string indicators (line just before first grid row)
  const indicatorLineIdx = firstGridRowIdx - 1;
  if (indicatorLineIdx >= 0) {
    const indicatorLine = lines[indicatorLineIdx];
    for (let i = 0; i < indicatorLine.length; i++) {
      const char = indicatorLine[i];
      const stringNum = getStringNumber(i);
      if (stringNum <= 0) continue;

      if (char === openChar || (!isUnicode && char === ASCII_OPEN)) {
        fingers.push([stringNum, 0, { text: "", color: blackColor }]);
      } else if (char === mutedChar || (!isUnicode && char === ASCII_MUTED)) {
        fingers.push([stringNum, "x", { text: "", color: blackColor }]);
      }
    }
  }

  // Parse fret rows
  let fretNumber = 1;
  let isFirstFretRow = true;

  for (let lineIdx = firstGridRowIdx; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    if (!isGridRow(line, isUnicode)) continue;

    // For Unicode format, skip separator rows (only process content rows with │)
    if (isUnicode && !isUnicodeFretRow(line)) continue;

    // Check for position number at start of first fret row (1-2 digits)
    if (isFirstFretRow) {
      const posMatch = line.match(/^\s*(\d{1,2})[\s│|]/);
      if (posMatch) {
        position = parseInt(posMatch[1], 10);
      }
      isFirstFretRow = false;
    }

    // Scan for fretted notes and finger numbers in this row
    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      // Skip separators and box characters
      if (isUnicode) {
        if (char === UNICODE_VERTICAL || "╒═╤╕├─┼┤└┴┘┌┬┐".includes(char) || char === " ") continue;
      } else {
        if (char === ASCII_VERTICAL || char === " ") continue;
      }

      const stringNum = getStringNumber(i);
      if (stringNum <= 0) continue;

      // Check for root marker
      if (char === rootChar) {
        fingers.push([stringNum, fretNumber, { text: "", color: redColor }]);
      }
      // Check for regular note (○ in Unicode, o in ASCII within grid)
      else if (char === UNICODE_OPEN || char === ASCII_OPEN) {
        fingers.push([stringNum, fretNumber, { text: "", color: blackColor }]);
      }
      // Check for finger number (digit)
      else if (/[0-9]/.test(char)) {
        fingers.push([stringNum, fretNumber, { text: char, color: blackColor }]);
      }
    }

    fretNumber++;
  }

  /** @type {import("svguitar").Chord} */
  const result = {
    fingers,
    barres: [],
    title,
  };

  if (position !== undefined) {
    result.position = position;
  }

  return result;
}