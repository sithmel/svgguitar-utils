//@ts-check

/**
 * Parse a string representation of a guitar fingering into internal format
 * @param {import("svguitar").Chord} chord
 * @param {object} [options]
 * @param {boolean} [options.useUnicode=false] - Whether to use Unicode characters for string/fret markers
 * @returns {string}
 */
export default function fingeringToString(chord, options = {}) {
  const { useUnicode = false } = options;
  const { fingers = [], title = "", position } = chord;

  // Handle empty chord
  if (fingers.length === 0 && !title) {
    return "";
  }

  // Special case: title but no fingers - show empty fretboard
  if (fingers.length === 0 && title) {
    const titleLine = title ? `  ${title}` : ` `;
    if (useUnicode) {
      return `${titleLine}
  ╒═╤═╤═╤═╤═╕
  │ │ │ │ │ │
  ├─┼─┼─┼─┼─┤
  │ │ │ │ │ │
  ├─┼─┼─┼─┼─┤
  │ │ │ │ │ │
  └─┴─┴─┴─┴─┘`;
    } else {
      return `${titleLine}
  ||||||
  ||||||
  ||||||`;
    }
  }

  // Parse fingers to build data structure
  const stringData = new Map(); // Map<string, Map<fret, fingerInfo>>
  let maxFret = 0;
  const openStrings = new Set();
  const mutedStrings = new Set();

  for (const finger of fingers) {
    const [string, fret, opts = {}] = finger;
    const optsObject = typeof opts === "object" ? opts : {};
    const { text = "", color = "#000000" } = optsObject;

    if (fret === 0) {
      openStrings.add(string);
    } else if (fret === "x") {
      mutedStrings.add(string);
    } else {
      if (!stringData.has(string)) {
        stringData.set(string, new Map());
      }
      stringData.get(string).set(fret, { text, color });
      
      if (fret > maxFret) maxFret = fret;
    }
  }

  // Determine number of frets to show
  const numFrets = fingers.some(f => typeof f[1] === "number" && f[1] > 0)
    ? Math.max(3, maxFret)
    : 3;

  if (useUnicode) {
    return buildUnicodeOutput(
      title,
      stringData,
      openStrings,
      mutedStrings,
      numFrets,
      position
    );
  } else {
    return buildAsciiOutput(
      title,
      stringData,
      openStrings,
      mutedStrings,
      numFrets,
      position
    );
  }
}

/**
 * Build ASCII format output
 * @param {string} title
 * @param {Map<number, Map<number, {text: string, color: string}>>} stringData
 * @param {Set<number>} openStrings
 * @param {Set<number>} mutedStrings
 * @param {number} numFrets
 * @param {number|undefined} position
 * @returns {string}
 */
function buildAsciiOutput(
  title,
  stringData,
  openStrings,
  mutedStrings,
  numFrets,
  position
) {
  const lines = [];
  
  // Title line
  const titleLine = title ? `  ${title}` : ` `;
  lines.push(titleLine);

  // Open/muted strings line - only if there are any
  if (openStrings.size > 0 || mutedStrings.size > 0) {
    let openLine = "  ";
    let lowestMarked = 6; // lowest numbered string (rightmost in display) that has a marker
    
    // Find lowest numbered string with a marker
    for (let str = 6; str >= 1; str--) {
      if (openStrings.has(str) || mutedStrings.has(str)) {
        lowestMarked = str;
      }
    }
    
    // Show from string 6 down to lowestMarked, extending to 3 only if lowestMarked > 4
    const showTo = lowestMarked > 4 ? 3 : lowestMarked;
    
    // Build line from string 6 down to showTo
    for (let str = 6; str >= showTo; str--) {
      if (openStrings.has(str)) {
        openLine += "o";
      } else if (mutedStrings.has(str)) {
        openLine += "x";
      } else {
        openLine += " ";
      }
    }
    
    lines.push(openLine);
  }

  // Fret lines
  for (let fret = 1; fret <= numFrets; fret++) {
    let line = "";
    
    // Add position number on first fret line if specified
    if (fret === 1 && position !== undefined) {
      line = `${position} `;
    } else {
      line = "  ";
    }

    // Build fret line (strings 6 to 1, left to right)
    for (let str = 6; str >= 1; str--) {
      const fingerInfo = stringData.get(str)?.get(fret);
      
      if (fingerInfo) {
        if (fingerInfo.color !== "#000000") {
          line += "*";
        } else if (fingerInfo.text) {
          line += fingerInfo.text;
        } else {
          line += "o";
        }
      } else {
        line += "|";
      }
    }
    
    lines.push(line);
  }

  return lines.join("\n");
}

/**
 * Build Unicode format output
 * @param {string} title
 * @param {Map<number, Map<number, {text: string, color: string}>>} stringData
 * @param {Set<number>} openStrings
 * @param {Set<number>} mutedStrings
 * @param {number} numFrets
 * @param {number|undefined} position
 * @returns {string}
 */
function buildUnicodeOutput(
  title,
  stringData,
  openStrings,
  mutedStrings,
  numFrets,
  position
) {
  const lines = [];
  
  // Title line
  const titleLine = title ? `  ${title}` : ` `;
  lines.push(titleLine);

  // Open/muted strings line - only if there are any
  if (openStrings.size > 0 || mutedStrings.size > 0) {
    let openLine = "  ";
    let lowestMarked = 6;
    
    // Find lowest numbered string with a marker
    for (let str = 6; str >= 1; str--) {
      if (openStrings.has(str) || mutedStrings.has(str)) {
        lowestMarked = str;
      }
    }
    
    // Show from string 6 down to lowestMarked, extending to 3 only if lowestMarked > 4
    const showTo = lowestMarked > 4 ? 3 : lowestMarked;
    
    // Build line from string 6 down to showTo
    for (let str = 6; str >= showTo; str--) {
      if (openStrings.has(str)) {
        openLine += "○";
      } else if (mutedStrings.has(str)) {
        openLine += "×";
      } else {
        openLine += " ";
      }
      if (str > showTo) openLine += " ";
    }
    
    // Trim trailing spaces if we extended to string 3 due to no marks there
    if (showTo === 3 && lowestMarked > 4) {
      openLine = openLine.trimEnd();
    }
    
    lines.push(openLine);
  }

  // Top border
  lines.push("  ╒═╤═╤═╤═╤═╕");

  // Fret lines
  for (let fret = 1; fret <= numFrets; fret++) {
    let line = "";
    
    // Add position number on first fret line if specified
    if (fret === 1 && position !== undefined) {
      line = `${position} `;
    } else {
      line = "  ";
    }

    // Build fret line (strings 6 to 1, left to right)
    for (let str = 6; str >= 1; str--) {
      const fingerInfo = stringData.get(str)?.get(fret);
      
      if (fingerInfo) {
        if (fingerInfo.color !== "#000000") {
          line += "●";
        } else if (fingerInfo.text) {
          line += fingerInfo.text;
        } else {
          line += "○";
        }
      } else {
        line += "│";
      }
      if (str > 1) line += " ";
    }
    
    lines.push(line);

    // Add separator or bottom border
    if (fret < numFrets) {
      lines.push("  ├─┼─┼─┼─┼─┤");
    } else {
      lines.push("  └─┴─┴─┴─┴─┘");
    }
  }

  return lines.join("\n");
}