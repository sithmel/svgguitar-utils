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
export default function splitStringInRectangles(str: string): Array<string>;
