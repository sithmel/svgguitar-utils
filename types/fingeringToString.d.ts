/**
 * Parse a string representation of a guitar fingering into internal format
 * @param {import("svguitar").Chord} chord
 * @param {object} [options]
 * @param {boolean} [options.useUnicode=false] - Whether to use Unicode characters for string/fret markers
 * @returns {string}
 */
export default function fingeringToString(chord: import("svguitar").Chord, options?: {
    useUnicode?: boolean;
}): string;
