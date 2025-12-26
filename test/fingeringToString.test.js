// @ts-check

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fingeringToString from "../lib/fingeringToString.js";

describe("fingeringToString", () => {
  describe("ASCII format output", () => {
    test("outputs simple A minor chord (open strings with dots)", () => {
      /** @type {import("svguitar").Chord} */
      const chord = {
        fingers: [
          [2, 1, { text: "", color: "#000000" }],
          [3, 2, { text: "", color: "#e74c3c" }],
          [4, 2, { text: "", color: "#000000" }],
          [5, 0, { text: "", color: "#000000" }],
          [6, 0, { text: "", color: "#000000" }],
          [1, 0, { text: "", color: "#000000" }],
        ],
        barres: [],
        title: "A min",
      };

      const result = fingeringToString(chord);

      const expected = `  A min
  oo   o
  ||||o|
  ||o*||
  ||||||`;

      assert.equal(result, expected);
    });

    test("outputs D chord with muted strings", () => {
      /** @type {import("svguitar").Chord} */
      const chord = {
        fingers: [
          [1, 2, { text: "", color: "#000000" }],
          [3, 2, { text: "", color: "#000000" }],
          [2, 3, { text: "", color: "#e74c3c" }],
          [6, "x", { text: "", color: "#000000" }],
          [5, 0, { text: "", color: "#000000" }],
          [4, 0, { text: "", color: "#000000" }],
        ],
        barres: [],
        title: "D",
      };

      const result = fingeringToString(chord);

      const expected = `  D
  xoo
  ||||||
  |||o|o
  ||||*|`;

      assert.equal(result, expected);
    });

    test("outputs G7 chord with starting fret number", () => {
      /** @type {import("svguitar").Chord} */
      const chord = {
        fingers: [
          [6, "x", { text: "", color: "#000000" }],
          [5, "x", { text: "", color: "#000000" }],
          [4, 1, { text: "", color: "#e74c3c" }],
          [2, 2, { text: "", color: "#000000" }],
          [3, 3, { text: "", color: "#000000" }],
          [1, 3, { text: "", color: "#000000" }],
        ],
        barres: [],
        title: "G 7",
        position: 5,
      };

      const result = fingeringToString(chord);

      const expected = `  G 7
  xx  
 5||*|||
  ||||o|
  |||o|o`;

      assert.equal(result, expected);
    });

    test("outputs G7 chord with starting with 2 digits fret number", () => {
      /** @type {import("svguitar").Chord} */
      const chord = {
        fingers: [
          [6, "x", { text: "", color: "#000000" }],
          [5, "x", { text: "", color: "#000000" }],
          [4, 1, { text: "", color: "#e74c3c" }],
          [2, 2, { text: "", color: "#000000" }],
          [3, 3, { text: "", color: "#000000" }],
          [1, 3, { text: "", color: "#000000" }],
        ],
        barres: [],
        title: "G 7",
        position: 15,
      };

      const result = fingeringToString(chord);

      const expected = `  G 7
  xx  
15||*|||
  ||||o|
  |||o|o`;

      assert.equal(result, expected);
    });

    test("outputs E dom 7 chord with finger numbers", () => {
      /** @type {import("svguitar").Chord} */
      const chord = {
        fingers: [
          [5, 2, { text: "5", color: "#000000" }],
          [4, 2, { text: "1", color: "#000000" }],
          [3, 1, { text: "3", color: "#000000" }],
          [2, 3, { text: "7", color: "#000000" }],
          [6, "x", { text: "", color: "#000000" }],
          [1, "x", { text: "", color: "#000000" }],
        ],
        barres: [],
        title: "E dom 7",
      };

      const result = fingeringToString(chord);

      const expected = `  E dom 7
  x    x
  |||3||
  |51|||
  ||||7|`;

      assert.equal(result, expected);
    });
  });

  describe("Unicode format output", () => {
    test("outputs A minor chord (Unicode format)", () => {
      /** @type {import("svguitar").Chord} */
      const chord = {
        fingers: [
          [2, 1, { text: "", color: "#000000" }],
          [3, 2, { text: "", color: "#e74c3c" }],
          [4, 2, { text: "", color: "#000000" }],
          [5, 0, { text: "", color: "#000000" }],
          [6, 0, { text: "", color: "#000000" }],
          [1, 0, { text: "", color: "#000000" }],
        ],
        barres: [],
        title: "A min",
      };

      const result = fingeringToString(chord, { useUnicode: true });

      const expected = `  A min
  ○ ○       ○
  ┌─┬─┬─┬─┬─┐
  │ │ │ │ ○ │
  ├─┼─┼─┼─┼─┤
  │ │ ○ ● │ │
  ├─┼─┼─┼─┼─┤
  │ │ │ │ │ │
  └─┴─┴─┴─┴─┘`;

      assert.equal(result, expected);
    });

    test("outputs D chord (Unicode format)", () => {
      /** @type {import("svguitar").Chord} */
      const chord = {
        fingers: [
          [1, 2, { text: "", color: "#000000" }],
          [3, 2, { text: "", color: "#000000" }],
          [2, 3, { text: "", color: "#e74c3c" }],
          [6, "x", { text: "", color: "#000000" }],
          [5, 0, { text: "", color: "#000000" }],
          [4, 0, { text: "", color: "#000000" }],
        ],
        barres: [],
        title: "D",
      };

      const result = fingeringToString(chord, { useUnicode: true });

      const expected = `  D
  × ○ ○
  ┌─┬─┬─┬─┬─┐
  │ │ │ │ │ │
  ├─┼─┼─┼─┼─┤
  │ │ │ ○ │ ○
  ├─┼─┼─┼─┼─┤
  │ │ │ │ ● │
  └─┴─┴─┴─┴─┘`;

      assert.equal(result, expected);
    });

    test("outputs G7 chord with starting fret (Unicode format)", () => {
      /** @type {import("svguitar").Chord} */
      const chord = {
        fingers: [
          [6, "x", { text: "", color: "#000000" }],
          [5, "x", { text: "", color: "#000000" }],
          [4, 1, { text: "", color: "#e74c3c" }],
          [2, 2, { text: "", color: "#000000" }],
          [3, 3, { text: "", color: "#000000" }],
          [1, 3, { text: "", color: "#000000" }],
        ],
        barres: [],
        title: "G 7",
        position: 5,
      };

      const result = fingeringToString(chord, { useUnicode: true });

      const expected = `  G 7
  × ×
  ┌─┬─┬─┬─┬─┐
 5│ │ ● │ │ │
  ├─┼─┼─┼─┼─┤
  │ │ │ │ ○ │
  ├─┼─┼─┼─┼─┤
  │ │ │ ○ │ ○
  └─┴─┴─┴─┴─┘`;

      assert.equal(result, expected);
    });

    test("outputs G7 chord with starting 2 digits starting fret (Unicode format)", () => {
      /** @type {import("svguitar").Chord} */
      const chord = {
        fingers: [
          [6, "x", { text: "", color: "#000000" }],
          [5, "x", { text: "", color: "#000000" }],
          [4, 1, { text: "", color: "#e74c3c" }],
          [2, 2, { text: "", color: "#000000" }],
          [3, 3, { text: "", color: "#000000" }],
          [1, 3, { text: "", color: "#000000" }],
        ],
        barres: [],
        title: "G 7",
        position: 15,
      };

      const result = fingeringToString(chord, { useUnicode: true });

      const expected = `  G 7
  × ×
  ┌─┬─┬─┬─┬─┐
15│ │ ● │ │ │
  ├─┼─┼─┼─┼─┤
  │ │ │ │ ○ │
  ├─┼─┼─┼─┼─┤
  │ │ │ ○ │ ○
  └─┴─┴─┴─┴─┘`;

      assert.equal(result, expected);
    });

    test("outputs G7 chord with starting fret equal 1 (Unicode format)", () => {
      /** @type {import("svguitar").Chord} */
      const chord = {
        fingers: [
          [6, "x", { text: "", color: "#000000" }],
          [5, "x", { text: "", color: "#000000" }],
          [4, 1, { text: "", color: "#e74c3c" }],
          [2, 2, { text: "", color: "#000000" }],
          [3, 3, { text: "", color: "#000000" }],
          [1, 3, { text: "", color: "#000000" }],
        ],
        barres: [],
        title: "G 7",
        position: 1,
      };

      const result = fingeringToString(chord, { useUnicode: true });

      const expected = `  G 7
  × ×
  ╒═╤═╤═╤═╤═╕
  │ │ ● │ │ │
  ├─┼─┼─┼─┼─┤
  │ │ │ │ ○ │
  ├─┼─┼─┼─┼─┤
  │ │ │ ○ │ ○
  └─┴─┴─┴─┴─┘`;

      assert.equal(result, expected);
    });

    test("outputs E dom 7 with finger numbers (Unicode format)", () => {
      /** @type {import("svguitar").Chord} */
      const chord = {
        fingers: [
          [5, 2, { text: "5", color: "#000000" }],
          [4, 2, { text: "1", color: "#000000" }],
          [3, 1, { text: "3", color: "#000000" }],
          [2, 3, { text: "7", color: "#000000" }],
          [6, "x", { text: "", color: "#000000" }],
          [1, "x", { text: "", color: "#000000" }],
        ],
        barres: [],
        title: "E dom 7",
      };

      const result = fingeringToString(chord, { useUnicode: true });

      const expected = `  E dom 7
  ×         ×
  ┌─┬─┬─┬─┬─┐
  │ │ │ 3 │ │
  ├─┼─┼─┼─┼─┤
  │ 5 1 │ │ │
  ├─┼─┼─┼─┼─┤
  │ │ │ │ 7 │
  └─┴─┴─┴─┴─┘`;

      assert.equal(result, expected);
    });
  });

  describe("Edge cases and variations", () => {
    test("handles empty chord", () => {
      /** @type {import("svguitar").Chord} */
      const chord = {
        fingers: [],
        barres: [],
      };

      const result = fingeringToString(chord);
      const expected = `  ||||||
  ||||||
  ||||||`;

      assert.equal(result, expected);
    });

    test("handles empty chord (unicode)", () => {
      /** @type {import("svguitar").Chord} */
      const chord = {
        fingers: [],
        barres: [],
      };

      const result = fingeringToString(chord, { useUnicode: true });
      const expected = `  ┌─┬─┬─┬─┬─┐
  │ │ │ │ │ │
  ├─┼─┼─┼─┼─┤
  │ │ │ │ │ │
  ├─┼─┼─┼─┼─┤
  │ │ │ │ │ │
  └─┴─┴─┴─┴─┘`;

      assert.equal(result, expected);
    });

    test("handles chord with no title", () => {
      /** @type {import("svguitar").Chord} */
      const chord = {
        fingers: [
          [2, 1, { text: "", color: "#000000" }],
          [3, 2, { text: "", color: "#e74c3c" }],
          [4, 2, { text: "", color: "#000000" }],
          [5, 0, { text: "", color: "#000000" }],
          [6, 0, { text: "", color: "#000000" }],
          [1, 0, { text: "", color: "#000000" }],
        ],
        barres: [],
        title: "",
      };

      const result = fingeringToString(chord);

      const expected = `  oo   o
  ||||o|
  ||o*||
  ||||||`;

      assert.equal(result, expected);
    });

    test("handles all open strings", () => {
      /** @type {import("svguitar").Chord} */
      const chord = {
        fingers: [
          [1, 0, { text: "", color: "#000000" }],
          [2, 0, { text: "", color: "#000000" }],
          [3, 0, { text: "", color: "#000000" }],
          [4, 0, { text: "", color: "#000000" }],
          [5, 0, { text: "", color: "#000000" }],
          [6, 0, { text: "", color: "#000000" }],
        ],
        barres: [],
        title: "E major",
      };

      const result = fingeringToString(chord);

      const expected = `  E major
  oooooo
  ||||||
  ||||||
  ||||||`;

      assert.equal(result, expected);
    });

    test("handles all muted strings", () => {
      /** @type {import("svguitar").Chord} */
      const chord = {
        fingers: [
          [1, "x", { text: "", color: "#000000" }],
          [2, "x", { text: "", color: "#000000" }],
          [3, "x", { text: "", color: "#000000" }],
          [4, "x", { text: "", color: "#000000" }],
          [5, "x", { text: "", color: "#000000" }],
          [6, "x", { text: "", color: "#000000" }],
        ],
        barres: [],
        title: "Muted",
      };

      const result = fingeringToString(chord);

      const expected = `  Muted
  xxxxxx
  ||||||
  ||||||
  ||||||`;

      assert.equal(result, expected);
    });

    test("handles chord with title but no fingers", () => {
      /** @type {import("svguitar").Chord} */
      const chord = {
        fingers: [],
        barres: [],
        title: "Muted",
      };

      const result = fingeringToString(chord);

      const expected = `  Muted
  ||||||
  ||||||
  ||||||`;

      assert.equal(result, expected);
    });
  });

  describe("Optional finger array element and properties", () => {
    test("third element of finger array is optional (defaults to black dot)", () => {
      /** @type {import("svguitar").Chord} */
      const chord = {
        fingers: [
          [3, 2],
          [4, 2],
          [2, 1],
        ],
        barres: [],
        title: "Test",
      };

      const result = fingeringToString(chord);

      const expected = `  Test
  ||||o|
  ||oo||
  ||||||`;  

      assert.equal(result, expected);
    });

    test("third element of finger array is optional (Unicode format)", () => {
      /** @type {import("svguitar").Chord} */
      const chord = {
        fingers: [
          [3, 2],
          [4, 2],
          [2, 1],
        ],
        barres: [],
        title: "Test",
      };

      const result = fingeringToString(chord, { useUnicode: true });

      const expected = `  Test
  ┌─┬─┬─┬─┬─┐
  │ │ │ │ ○ │
  ├─┼─┼─┼─┼─┤
  │ │ ○ ○ │ │
  ├─┼─┼─┼─┼─┤
  │ │ │ │ │ │
  └─┴─┴─┴─┴─┘`;

      assert.equal(result, expected);
    });

    test("text property is optional (defaults to empty string)", () => {
      /** @type {import("svguitar").Chord} */
      const chord = {
        fingers: [
          [3, 2, { color: "#000000" }],
          [4, 2, { color: "#000000" }],
        ],
        barres: [],
        title: "Test",
      };

      const result = fingeringToString(chord);

      const expected = `  Test
  ||||||
  ||oo||
  ||||||`;

      assert.equal(result, expected);
    });

    test("color property is optional (defaults to black)", () => {
      /** @type {import("svguitar").Chord} */
      const chord = {
        fingers: [
          [3, 2, { text: "1" }],
          [4, 2, { text: "2" }],
        ],
        barres: [],
        title: "Test",
      };

      const result = fingeringToString(chord);

      const expected = `  Test
  ||||||
  ||21||
  ||||||`;

      assert.equal(result, expected);
    });

    test("non-black color ignores text and shows root marker (ASCII)", () => {
      /** @type {import("svguitar").Chord} */
      const chord = {
        fingers: [
          [3, 2, { text: "R", color: "#e74c3c" }],
          [4, 2, { text: "3", color: "#000000" }],
        ],
        barres: [],
        title: "Test",
      };

      const result = fingeringToString(chord);

      const expected = `  Test
  ||||||
  ||3*||
  ||||||`;

      assert.equal(result, expected);
    });

    test("non-black color ignores text and shows root marker (Unicode)", () => {
      /** @type {import("svguitar").Chord} */
      const chord = {
        fingers: [
          [3, 2, { text: "R", color: "#e74c3c" }],
          [4, 2, { text: "3", color: "#000000" }],
        ],
        barres: [],
        title: "Test",
      };

      const result = fingeringToString(chord, { useUnicode: true });

      const expected = `  Test
  ┌─┬─┬─┬─┬─┐
  │ │ │ │ │ │
  ├─┼─┼─┼─┼─┤
  │ │ 3 ● │ │
  ├─┼─┼─┼─┼─┤
  │ │ │ │ │ │
  └─┴─┴─┴─┴─┘`;

      assert.equal(result, expected);
    });

    test("any non-black color is treated as root marker", () => {
      /** @type {import("svguitar").Chord} */
      const chord = {
        fingers: [
          [3, 2, { text: "", color: "#ff0000" }],
          [4, 2, { text: "", color: "#00ff00" }],
          [5, 2, { text: "", color: "#0000ff" }],
        ],
        barres: [],
        title: "Test",
      };

      const result = fingeringToString(chord);

      const expected = `  Test
  ||||||
  |***||
  ||||||`;

      assert.equal(result, expected);
    });

    test("empty options object in finger array treated as default", () => {
      /** @type {import("svguitar").Chord} */
      const chord = {
        fingers: [
          [3, 2, {}],
          [4, 2, {}],
        ],
        barres: [],
        title: "Test",
      };

      const result = fingeringToString(chord);

      const expected = `  Test
  ||||||
  ||oo||
  ||||||`;

      assert.equal(result, expected);
    });
  });
});
