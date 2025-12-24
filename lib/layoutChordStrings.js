//@ts-check

/**
 * Arranges an array of multi-line chord strings into a grid layout with proper padding.
 * Empty strings are filtered out and trailing spaces are trimmed from each output line.
 * 
 * @param {Array<string>} strings - Array of chord strings (can be multi-line)
 * @param {number} columns - Number of columns per row (default: 3)
 * @returns {string} - Formatted grid layout string
 */
export default function layoutChordStrings(strings, columns = 3) {
  // Filter out empty strings
  const filtered = strings.filter(s => s !== '');
  
  // Handle empty array
  if (filtered.length === 0) {
    return '';
  }
  
  // Trim trailing newlines from each string
  const trimmed = filtered.map(s => s.replace(/\n+$/, ''));
  
  // Split each string into lines
  const stringLines = trimmed.map(s => s.split('\n'));
  
  // Group strings into rows
  const rows = [];
  for (let i = 0; i < stringLines.length; i += columns) {
    rows.push(stringLines.slice(i, i + columns));
  }
  
  // Calculate max width for each column across all rows
  const columnWidths = new Array(columns).fill(0);
  for (const row of rows) {
    row.forEach((lines, colIndex) => {
      const maxWidth = Math.max(...lines.map(line => line.length));
      columnWidths[colIndex] = Math.max(columnWidths[colIndex], maxWidth);
    });
  }
  
  // Build output
  const outputRows = [];
  
  // Determine spacing strategy based on column width uniformity
  // If all columns have the same width of 1: use fixed 2-space separator
  // If all columns have the same width > 1: use 1-space separator
  // If columns have different widths: use variable padding for better alignment
  const allWidthsEqual = columnWidths.length > 0 && columnWidths.every(w => w === columnWidths[0]);
  const firstWidth = columnWidths[0] || 0;
  const useFixedSpacing = allWidthsEqual && firstWidth === 1;
  
  for (const row of rows) {
    // Find max height in this row
    const rowHeight = Math.max(...row.map(lines => lines.length));
    
    // Build each line of this row
    const rowLines = [];
    for (let lineIdx = 0; lineIdx < rowHeight; lineIdx++) {
      const lineParts = [];
      for (let colIdx = 0; colIdx < columns; colIdx++) {
        const lines = colIdx < row.length ? row[colIdx] : [];
        const line = lineIdx < lines.length ? lines[lineIdx] : '';
        
        if (!useFixedSpacing && colIdx < columns - 1 && colIdx < columnWidths.length - 1) {
          // Variable padding: based on column widths
          // Pad to max(current_width + 1, next_width + 1) to ensure proper alignment
          const padWidth = Math.max(columnWidths[colIdx] + 1, columnWidths[colIdx + 1] + 1);
          lineParts.push(line.padEnd(padWidth));
        } else {
          // Fixed spacing or last column: pad to column width
          lineParts.push(line.padEnd(columnWidths[colIdx]));
        }
      }
      
      // Join and trim
      if (useFixedSpacing) {
        // Fixed spacing: join with 2-space separator
        rowLines.push(lineParts.join('  ').trimEnd());
      } else {
        // Variable padding: parts already include spacing
        rowLines.push(lineParts.join('').trimEnd());
      }
    }
    outputRows.push(rowLines.join('\n'));
  }
  
  return outputRows.join('\n\n');
}