/**
 * Arranges an array of multi-line chord strings into a grid layout with proper padding.
 * Empty strings are filtered out and trailing spaces are trimmed from each output line.
 *
 * @param {Array<string>} strings - Array of chord strings (can be multi-line)
 * @param {number} columns - Number of columns per row (default: 3)
 * @param {number} spacing - Number of spaces between columns (default: 1)
* @returns {string} - Formatted grid layout string
 */
export default function layoutChordStrings(strings: Array<string>, columns?: number, spacing?: number): string;
