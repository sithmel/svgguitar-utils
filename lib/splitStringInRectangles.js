//@ts-check

/**
 * This function takes a string and splits it into an array of strings,
 * each of the strings is a rectangle present in the original string and
 * separated by spaces
 * 
 * How it works:
 * - convert the string into a 2D array of characters
 * - scan the array left to right and top to bottom to find a non space character
 * - once found search all adjacent non space characters using breadth first search, 
 * Consider horizontal, vertical and diagonal adjacency
 * - once exhausted the search, determine the rectangle that bounds all found characters
 * - extract the rectangle as a string and add it to the result array
 * - mark all characters in the rectangle as visited (set to space)
 * - continue scanning the array until all characters are visited
 * @param {string} str
 * @returns {Array<string>}
 */
export default function splitStringInRectangles(str) {
  // Early validation
  if (!str || str.trim() === '') {
    return [];
  }

  // Convert string to 2D array of characters
  const grid = str.split('\n').map(line => line.split(''));
  const result = [];

  // 8 directions: horizontal, vertical, and diagonal
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  /**
   * BFS to find all connected non-space characters
   * @param {number} startRow
   * @param {number} startCol
   * @returns {{minRow: number, maxRow: number, minCol: number, maxCol: number, positions: Array<[number, number]>}}
   */
  function bfs(startRow, startCol) {
    const queue = [[startRow, startCol]];
    /** @type {Array<[number, number]>} */
    const positions = [[startRow, startCol]];
    let minRow = startRow;
    let maxRow = startRow;
    let minCol = startCol;
    let maxCol = startCol;

    // Mark starting position as visited
    grid[startRow][startCol] = ' ';

    while (queue.length > 0) {
      const [row, col] = queue.shift();

      // Check all 8 directions
      for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;

        // Check bounds
        if (newRow >= 0 && newRow < grid.length &&
            newCol >= 0 && newCol < grid[newRow].length) {
          // Check if non-space character
          if (grid[newRow][newCol] !== ' ') {
            queue.push([newRow, newCol]);
            positions.push([newRow, newCol]);

            // Update bounding rectangle
            minRow = Math.min(minRow, newRow);
            maxRow = Math.max(maxRow, newRow);
            minCol = Math.min(minCol, newCol);
            maxCol = Math.max(maxCol, newCol);

            // Mark as visited
            grid[newRow][newCol] = ' ';
          }
        }
      }
    }

    return { minRow, maxRow, minCol, maxCol, positions };
  }

  /**
   * Extract rectangle string from positions
   * @param {{minRow: number, maxRow: number, minCol: number, maxCol: number, positions: Array<[number, number]>}} bounds
   * @returns {string}
   */
  function extractRectangle(bounds) {
    const { minRow, maxRow, minCol, maxCol, positions } = bounds;
    const height = maxRow - minRow + 1;
    const width = maxCol - minCol + 1;

    // Create 2D array filled with spaces
    const rectGrid = Array(height).fill(null).map(() => Array(width).fill(' '));

    // Place characters at their relative positions
    for (const [row, col] of positions) {
      const relRow = row - minRow;
      const relCol = col - minCol;
      // Get original character from input (before it was marked as space)
      const lines = str.split('\n');
      if (row < lines.length && col < lines[row].length) {
        rectGrid[relRow][relCol] = lines[row][col];
      }
    }

    // Convert to string, preserving internal spaces
    return rectGrid
      .map(row => row.join(''))
      .join('\n');
  }

  // Scan grid left to right, top to bottom
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      // Find non-space character
      if (grid[row][col] !== ' ') {
        // BFS to find all connected characters
        const bounds = bfs(row, col);
        // Extract rectangle and add to result
        const rectangle = extractRectangle(bounds);
        result.push(rectangle);
      }
    }
  }

  return result;
}