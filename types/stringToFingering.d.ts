/**
 * Parse a string representation of a guitar fingering into internal format
 * @param {string} fingeringStr - The string representation of the fingering
 * @param {{ redColor?: string, blackColor?: string }} [options]
 * @returns {import("svguitar").Chord} The parsed fingering object
 */
export default function stringToFingering(fingeringStr: string, options?: {
    redColor?: string;
    blackColor?: string;
}): import("svguitar").Chord;
