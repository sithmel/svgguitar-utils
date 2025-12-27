// @ts-check

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import stringToFingering from "../lib/stringToFingering.js";

/**
 * @param {import("svguitar").Finger} fingerA
 * @param {import("svguitar").Finger} fingerB
 * @returns {boolean}
 */
const isFingerEqual = (fingerA, fingerB) => {
  if (!(fingerA[0] === fingerB[0] && fingerA[1] === fingerB[1])) {
    return false;
  }
  if (typeof fingerA[2] === "object" && typeof fingerB[2] === "object") {
    return (
      fingerA[2].color === fingerB[2].color &&
      fingerA[2].text === fingerB[2].text
    );
  }
  return fingerA === fingerB;
};

/**
 * @param {import("svguitar").Chord | null} result
 * @param {Array<import("svguitar").Finger>} fingers
 * @returns {boolean}
 */
function fingersContains(result, fingers) {
  if (!result) {
    return false;
  }
  if (fingers.length !== result.fingers.length) {
    return false;
  }
  for (const finger of fingers) {
    const found = result.fingers.find((f) => isFingerEqual(f, finger));
    if (!found) {
      return false;
    }
  }
  return true;
}

describe("stringToFingering", () => {
  describe("ASCII format parsing", () => {
    test("parses simple A minor chord (open strings with dots)", () => {
      const fingeringStr = `  A min
  ######
  oo   o
  ------
  ||||o|
  ||o*||
  ||||||`;

      const result = stringToFingering(fingeringStr);
      assert.equal(
        fingersContains(result, [
          [
            2,
            1,
            {
              text: "",
              color: "#000000",
            },
          ],
          [
            3,
            2,
            {
              text: "",
              color: "#e74c3c",
            },
          ],
          [
            4,
            2,
            {
              text: "",
              color: "#000000",
            },
          ],
          [5, 0, { text: "", color: "#000000" }],
          [6, 0, { text: "", color: "#000000" }],
          [1, 0, { text: "", color: "#000000" }],
        ]),
        true, 
        "Fingering does not match expected A minor chord"
      );
      assert.equal(
        result?.title,
        "A min",
        "Title does not match expected A min"
      );
      assert.equal(
        result?.position,
        undefined,
        "Position does not match expected undefined"
      );
      assert.deepEqual(result.barres, [], "Barres should be empty");
    });

    test("parses D chord with muted strings", () => {
      const fingeringStr = `  D
  ######
  xoo
  ------
  ||||||
  |||o|o
  ||||*|`;

      const result = stringToFingering(fingeringStr);

      assert.equal(
        fingersContains(result, [
          [
            1,
            2,
            {
              text: "",
              color: "#000000",
            },
          ],
          [
            3,
            2,
            {
              text: "",
              color: "#000000",
            },
          ],
          [
            2,
            3,
            {
              text: "",
              color: "#e74c3c",
            },
          ],
          [6, "x", {text: "", color: "#000000"}],
          [5, 0, {text: "", color: "#000000"}],
          [4, 0, {text: "", color: "#000000"}],
        ]),
        true, 
        "Fingering does not match expected D chord"
      );
      assert.equal(result?.title, "D", "Title does not match expected D");
      assert.equal(
        result?.position,
        undefined,
        "Position does not match expected undefined"
      );
      assert.deepEqual(result?.barres, [], "Barres should be empty");
    });

    test("parses G7 chord with starting fret number", () => {
      const fingeringStr = `  G 7
  ######
  xx
  ------
 5||*|||
  ||||o|
  |||o|o`;

      const result = stringToFingering(fingeringStr);

      assert.equal(
        fingersContains(result, [
          [6, "x", {text: "", color: "#000000"}],
          [5, "x", {text: "", color: "#000000"}],
          [
            4,
            1,
            {
              text: "",
              color: "#e74c3c",
            },
          ],
          [
            2,
            2,
            {
              text: "",
              color: "#000000",
            },
          ],
          [
            3,
            3,
            {
              text: "",
              color: "#000000",
            },
          ],
          [
            1,
            3,
            {
              text: "",
              color: "#000000",
            },
          ],
        ]),
        true, 
        "Fingering does not match expected G7 chord"
      );
      assert.equal(result?.title, "G 7", "Title does not match expected G 7");
      assert.equal(result?.position, 5, "Position does not match expected 5");
      assert.deepEqual(result?.barres, [], "Barres should be empty");
    });

    test("parses G7 chord with starting fret number 1", () => {
      const fingeringStr = `  G 7
  ######
  xx
  ------
 1||*|||
  ||||o|
  |||o|o`;

      const result = stringToFingering(fingeringStr);

      assert.equal(
        fingersContains(result, [
          [6, "x", {text: "", color: "#000000"}],
          [5, "x", {text: "", color: "#000000"}],
          [
            4,
            1,
            {
              text: "",
              color: "#e74c3c",
            },
          ],
          [
            2,
            2,
            {
              text: "",
              color: "#000000",
            },
          ],
          [
            3,
            3,
            {
              text: "",
              color: "#000000",
            },
          ],
          [
            1,
            3,
            {
              text: "",
              color: "#000000",
            },
          ],
        ]),
        true, 
        "Fingering does not match expected G7 chord"
      );
      assert.equal(result?.title, "G 7", "Title does not match expected G 7");
      assert.equal(result?.position, 1, "Position does not match expected 1");
      assert.deepEqual(result?.barres, [], "Barres should be empty");
    });

    test("parses G7 chord with starting fret number 1 (alternate version)", () => {
      const fingeringStr = `  G 7
  ######
  xx
  ======
  ||*|||
  ||||o|
  |||o|o`;

      const result = stringToFingering(fingeringStr);

      assert.equal(
        fingersContains(result, [
          [6, "x", {text: "", color: "#000000"}],
          [5, "x", {text: "", color: "#000000"}],
          [
            4,
            1,
            {
              text: "",
              color: "#e74c3c",
            },
          ],
          [
            2,
            2,
            {
              text: "",
              color: "#000000",
            },
          ],
          [
            3,
            3,
            {
              text: "",
              color: "#000000",
            },
          ],
          [
            1,
            3,
            {
              text: "",
              color: "#000000",
            },
          ],
        ]),
        true, 
        "Fingering does not match expected G7 chord"
      );
      assert.equal(result?.title, "G 7", "Title does not match expected G 7");
      assert.equal(result?.position, 1, "Position does not match expected 1");
      assert.deepEqual(result?.barres, [], "Barres should be empty");
    });

    test("parses G7 chord with 2 digits starting fret number", () => {
      const fingeringStr = `  G 7
  ######
  xx
  ------
15||*|||
  ||||o|
  |||o|o`;

      const result = stringToFingering(fingeringStr);

      assert.equal(
        fingersContains(result, [
          [6, "x", {text: "", color: "#000000"}],
          [5, "x", {text: "", color: "#000000"}],
          [
            4,
            1,
            {
              text: "",
              color: "#e74c3c",
            },
          ],
          [
            2,
            2,
            {
              text: "",
              color: "#000000",
            },
          ],
          [
            3,
            3,
            {
              text: "",
              color: "#000000",
            },
          ],
          [
            1,
            3,
            {
              text: "",
              color: "#000000",
            },
          ],
        ]),
        true, 
        "Fingering does not match expected G7 chord"
      );
      assert.equal(result?.title, "G 7", "Title does not match expected G 7");
      assert.equal(result?.position, 15, "Position does not match expected 15");
      assert.deepEqual(result?.barres, [], "Barres should be empty");
    });

    test("parses E dom 7 chord with finger numbers", () => {
      const fingeringStr = `  E dom 7
  #######
  x    x
  ------
  |||3||
  |51|||
  ||||7|`;

      const result = stringToFingering(fingeringStr);
      assert.equal(
        fingersContains(result, [
          [
            5,
            2,
            {
              text: "5",
              color: "#000000",
            },
          ],
          [
            4,
            2,
            {
              text: "1",
              color: "#000000",
            },
          ],
          [
            3,
            1,
            {
              text: "3",
              color: "#000000",
            },
          ],
          [
            2,
            3,
            {
              text: "7",
              color: "#000000",
            },
          ],
          [6, "x", {text: "", color: "#000000"}],
          [1, "x", {text: "", color: "#000000"}],
        ]),
        true, 
        "Fingering does not match expected E dom 7 chord with finger numbers"
      );
      assert.equal(
        result?.title,
        "E dom 7",
        "Title does not match expected E dom 7"
      );
      assert.equal(
        result?.position,
        undefined,
        "Position does not match expected undefined"
      );
      assert.deepEqual(result?.barres, [], "Barres should be empty");
    });
  });

  describe("Unicode format parsing", () => {
    test("parses A minor chord (Unicode format)", () => {
      const fingeringStr = `  A min
  ‾‾‾‾‾‾‾‾‾‾‾
  ○ ○       ○
  ┌─┬─┬─┬─┬─┐
  │ │ │ │ ○ │
  ├─┼─┼─┼─┼─┤
  │ │ ○ ● │ │
  ├─┼─┼─┼─┼─┤
  │ │ │ │ │ │
  └─┴─┴─┴─┴─┘`;

      const result = stringToFingering(fingeringStr);
      assert.equal(
        fingersContains(result, [
          [
            2,
            1,
            {
              text: "",
              color: "#000000",
            },
          ],
          [
            3,
            2,
            {
              text: "",
              color: "#e74c3c",
            },
          ],
          [
            4,
            2,
            {
              text: "",
              color: "#000000",
            },
          ],
          [5, 0, { text: "", color: "#000000" }],
          [6, 0, { text: "", color: "#000000" }],
          [1, 0, { text: "", color: "#000000" }],
        ]),
        true, 
        "Fingering does not match expected A minor chord"
      );
      assert.equal(
        result?.title,
        "A min",
        "Title does not match expected A min"
      );
      assert.equal(
        result?.position,
        undefined,
        "Position does not match expected undefined"
      );
      assert.deepEqual(result?.barres, [], "Barres should be empty");    });
    test("parses D chord (Unicode format)", () => {
      const fingeringStr = `  D
  ‾‾‾‾‾‾‾‾‾‾‾
  × ○ ○
  ┌─┬─┬─┬─┬─┐
  │ │ │ │ │ │
  ├─┼─┼─┼─┼─┤
  │ │ │ ○ │ ○
  ├─┼─┼─┼─┼─┤
  │ │ │ │ ● │
  └─┴─┴─┴─┴─┘`;

      const result = stringToFingering(fingeringStr);

      assert.equal(
        fingersContains(result, [
          [
            1,
            2,
            {
              text: "",
              color: "#000000",
            },
          ],
          [
            3,
            2,
            {
              text: "",
              color: "#000000",
            },
          ],
          [
            2,
            3,
            {
              text: "",
              color: "#e74c3c",
            },
          ],
          [6, "x", {text: "", color: "#000000"}],
          [5, 0, {text: "", color: "#000000"}],
          [4, 0, {text: "", color: "#000000"}],
        ]),
        true, 
        "Fingering does not match expected D chord"
      );
      assert.equal(result?.title, "D", "Title does not match expected D");
      assert.equal(
        result?.position,
        undefined,
        "Position does not match expected undefined"
      );
      assert.deepEqual(result?.barres, [], "Barres should be empty");
    });

    test("parses G7 chord with starting fret (Unicode format)", () => {
      const fingeringStr = `  G 7
  ‾‾‾‾‾‾‾‾‾‾‾
  × ×
  ┌─┬─┬─┬─┬─┐
 5│ │ ● │ │ │
  ├─┼─┼─┼─┼─┤
  │ │ │ │ ○ │
  ├─┼─┼─┼─┼─┤
  │ │ │ ○ │ ○
  └─┴─┴─┴─┴─┘`;

      const result = stringToFingering(fingeringStr);

      assert.equal(
        fingersContains(result, [
          [6, "x", {text: "", color: "#000000"}],
          [5, "x", {text: "", color: "#000000"}],
          [
            4,
            1,
            {
              text: "",
              color: "#e74c3c",
            },
          ],
          [
            2,
            2,
            {
              text: "",
              color: "#000000",
            },
          ],
          [
            3,
            3,
            {
              text: "",
              color: "#000000",
            },
          ],
          [
            1,
            3,
            {
              text: "",
              color: "#000000",
            },
          ],
        ]),
        true, 
        "Fingering does not match expected G7 chord"
      );
      assert.equal(result?.title, "G 7", "Title does not match expected G 7");
      assert.equal(result?.position, 5, "Position does not match expected 5");
      assert.deepEqual(result?.barres, [], "Barres should be empty");
    });

    test("parses G7 chord with 2 digits starting fret (Unicode format)", () => {
      const fingeringStr = `  G 7
  ‾‾‾‾‾‾‾‾‾‾‾
  × ×
  ┌─┬─┬─┬─┬─┐
15│ │ ● │ │ │
  ├─┼─┼─┼─┼─┤
  │ │ │ │ ○ │
  ├─┼─┼─┼─┼─┤
  │ │ │ ○ │ ○
  └─┴─┴─┴─┴─┘`;

      const result = stringToFingering(fingeringStr);

      assert.equal(
        fingersContains(result, [
          [6, "x", {text: "", color: "#000000"}],
          [5, "x", {text: "", color: "#000000"}],
          [
            4,
            1,
            {
              text: "",
              color: "#e74c3c",
            },
          ],
          [
            2,
            2,
            {
              text: "",
              color: "#000000",
            },
          ],
          [
            3,
            3,
            {
              text: "",
              color: "#000000",
            },
          ],
          [
            1,
            3,
            {
              text: "",
              color: "#000000",
            },
          ],
        ]),
        true, 
        "Fingering does not match expected G7 chord"
      );
      assert.equal(result?.title, "G 7", "Title does not match expected G 7");
      assert.equal(result?.position, 15, "Position does not match expected 15");
      assert.deepEqual(result?.barres, [], "Barres should be empty");
    });

    test("parses G7 chord with 1 starting fret (Unicode format)", () => {
      const fingeringStr = `  G 7
  ‾‾‾‾‾‾‾‾‾‾‾
  × ×
  ┌─┬─┬─┬─┬─┐
 1│ │ ● │ │ │
  ├─┼─┼─┼─┼─┤
  │ │ │ │ ○ │
  ├─┼─┼─┼─┼─┤
  │ │ │ ○ │ ○
  └─┴─┴─┴─┴─┘`;

      const result = stringToFingering(fingeringStr);

      assert.equal(
        fingersContains(result, [
          [6, "x", {text: "", color: "#000000"}],
          [5, "x", {text: "", color: "#000000"}],
          [
            4,
            1,
            {
              text: "",
              color: "#e74c3c",
            },
          ],
          [
            2,
            2,
            {
              text: "",
              color: "#000000",
            },
          ],
          [
            3,
            3,
            {
              text: "",
              color: "#000000",
            },
          ],
          [
            1,
            3,
            {
              text: "",
              color: "#000000",
            },
          ],
        ]),
        true, 
        "Fingering does not match expected G7 chord"
      );
      assert.equal(result?.title, "G 7", "Title does not match expected G 7");
      assert.equal(result?.position, 1, "Position does not match expected 1");
      assert.deepEqual(result?.barres, [], "Barres should be empty");
    });

    test("parses G7 chord with 1 starting fret (Unicode format) - alternate version", () => {
      const fingeringStr = `  G 7
  ‾‾‾‾‾‾‾‾‾‾‾
  × ×
  ╒═╤═╤═╤═╤═╕
  │ │ ● │ │ │
  ├─┼─┼─┼─┼─┤
  │ │ │ │ ○ │
  ├─┼─┼─┼─┼─┤
  │ │ │ ○ │ ○
  └─┴─┴─┴─┴─┘`;

      const result = stringToFingering(fingeringStr);

      assert.equal(
        fingersContains(result, [
          [6, "x", {text: "", color: "#000000"}],
          [5, "x", {text: "", color: "#000000"}],
          [
            4,
            1,
            {
              text: "",
              color: "#e74c3c",
            },
          ],
          [
            2,
            2,
            {
              text: "",
              color: "#000000",
            },
          ],
          [
            3,
            3,
            {
              text: "",
              color: "#000000",
            },
          ],
          [
            1,
            3,
            {
              text: "",
              color: "#000000",
            },
          ],
        ]),
        true, 
        "Fingering does not match expected G7 chord"
      );
      assert.equal(result?.title, "G 7", "Title does not match expected G 7");
      assert.equal(result?.position, 1, "Position does not match expected 1");
      assert.deepEqual(result?.barres, [], "Barres should be empty");
    });

    test("parses E dom 7 with finger numbers (Unicode format)", () => {
      const fingeringStr = `  E dom 7
  ‾‾‾‾‾‾‾‾‾‾‾
  ×         ×
  ┌─┬─┬─┬─┬─┐
  │ │ │ 3 │ │
  ├─┼─┼─┼─┼─┤
  │ 5 1 │ │ │
  ├─┼─┼─┼─┼─┤
  │ │ │ │ 7 │
  └─┴─┴─┴─┴─┘`;

      const result = stringToFingering(fingeringStr);
      assert.equal(
        fingersContains(result, [
          [
            5,
            2,
            {
              text: "5",
              color: "#000000",
            },
          ],
          [
            4,
            2,
            {
              text: "1",
              color: "#000000",
            },
          ],
          [
            3,
            1,
            {
              text: "3",
              color: "#000000",
            },
          ],
          [
            2,
            3,
            {
              text: "7",
              color: "#000000",
            },
          ],
          [6, "x", {text: "", color: "#000000"}],
          [1, "x", {text: "", color: "#000000"}],
        ]),
        true, 
        "Fingering does not match expected E dom 7 chord with finger numbers"
      );
      assert.equal(
        result?.title,
        "E dom 7",
        "Title does not match expected E dom 7"
      );
      assert.equal(
        result?.position,
        undefined,
        "Position does not match expected undefined"
      );
      assert.deepEqual(result?.barres, [], "Barres should be empty");
    });
  });

  describe("Edge cases and variations", () => {
    test("handles empty fingering string", () => {
      const result = stringToFingering("");

      assert.equal(result, null, "Result should be null for empty string");
    });

    test("handles fingering with no title", () => {
      const fingeringStr = `  oo   o
  ------
  ||||o|
  ||o*||
  ||||||`;
      const result = stringToFingering(fingeringStr);

      assert.equal(
        fingersContains(result, [
          [
            2,
            1,
            {
              text: "",
              color: "#000000",
            },
          ],
          [
            3,
            2,
            {
              text: "",
              color: "#e74c3c",
            },
          ],
          [
            4,
            2,
            {
              text: "",
              color: "#000000",
            },
          ],
          [5, 0, { text: "", color: "#000000" }],
          [6, 0, { text: "", color: "#000000" }],
          [1, 0, { text: "", color: "#000000" }],
        ]),
        true, 
        "Fingering does not match expected A minor chord"
      );
      assert.equal(
        result?.title,
        "",
        "Title should be empty"
      );
      assert.equal(
        result?.position,
        undefined,
        "Position does not match expected undefined"
      );
      assert.deepEqual(result?.barres, [], "Barres should be empty");
    });

    test("handles all open strings", () => {
      const fingeringStr = `  E major
  ######
  oooooo
  ------
  ||||||
  ||||||
  ||||||`;

      const result = stringToFingering(fingeringStr);

      assert.equal(
        fingersContains(result, [
          [1, 0, { text: "", color: "#000000" }],
          [2, 0, { text: "", color: "#000000" }],
          [3, 0, { text: "", color: "#000000" }],
          [4, 0, { text: "", color: "#000000" }],
          [5, 0, { text: "", color: "#000000" }],
          [6, 0, { text: "", color: "#000000" }],
        ]),
        true, 
        "Fingering does not match expected E major"
      );
      assert.equal(
        result?.title,
        "E major",
        "Title does not match expected E major"
      );
      assert.equal(
        result?.position,
        undefined,
        "Position does not match expected undefined"
      );
      assert.deepEqual(result?.barres, [], "Barres should be empty");
    });

    test("handles all muted strings", () => {
      const fingeringStr = `  Muted
  ######
  xxxxxx
  ------
  ||||||
  ||||||
  ||||||`;

      const result = stringToFingering(fingeringStr);

      assert.equal(
        fingersContains(result, [
          [1, 'x', { text: "", color: "#000000" }],
          [2, 'x', { text: "", color: "#000000" }],
          [3, 'x', { text: "", color: "#000000" }],
          [4, 'x', { text: "", color: "#000000" }],
          [5, 'x', { text: "", color: "#000000" }],
          [6, 'x', { text: "", color: "#000000" }],
        ]), true,
        "Fingering does not match expected Muted strings"
      );
      assert.equal(
        result?.title,
        "Muted",
        "Title does not match expected Muted"
      );
      assert.equal(
        result?.position,
        undefined,
        "Position does not match expected undefined"
      );
      assert.deepEqual(result?.barres, [], "Barres should be empty");
    });

  test("handles no indications for open strings", () => {
      const fingeringStr = `  Muted
  ######
  ||||||
  ||||||
  ||||||`;

      const result = stringToFingering(fingeringStr);
      assert.equal(
        fingersContains(result, []),
        true, 
        "Fingering does not match expected Muted strings"
      );
      assert.equal(
        result?.title,
        "Muted",
        "Title does not match expected Muted"
      );
      assert.equal(
        result?.position,
        undefined,
        "Position does not match expected undefined"
      );
      assert.deepEqual(result?.barres, [], "Barres should be empty");
    });

  test("handles no title or open strings (bug 1)", () => {
      const fingeringStr = `  ------
  oooooo
  ||||||
  ||||||`;

      const result = stringToFingering(fingeringStr);
      assert.equal(
        fingersContains(result, [
          [1, 1, { text: "", color: "#000000" }],
          [2, 1, { text: "", color: "#000000" }],
          [3, 1, { text: "", color: "#000000" }],
          [4, 1, { text: "", color: "#000000" }],
          [5, 1, { text: "", color: "#000000" }],
          [6, 1, { text: "", color: "#000000" }],
        ]), true,
        "Fingering does not match expected strings"
      );
      assert.equal(
        result?.title,
        "",
        "Title should be undefined"
      );
      assert.equal(
        result?.position,
        undefined,
        "Position does not match expected undefined"
      );
      assert.deepEqual(result?.barres, [], "Barres should be empty");
    });

  test("handles no title or open strings in unicode (bug 2)", () => {
      const fingeringStr = `  ┌─┬─┬─┬─┬─┐
  ○ ○ ○ ○ ○ ○
  ├─┼─┼─┼─┼─┤
  │ │ │ │ │ │
  ├─┼─┼─┼─┼─┤
  │ │ │ │ │ │
  └─┴─┴─┴─┴─┘`;

      const result = stringToFingering(fingeringStr);
      assert.equal(
        fingersContains(result, [
          [1, 1, { text: "", color: "#000000" }],
          [2, 1, { text: "", color: "#000000" }],
          [3, 1, { text: "", color: "#000000" }],
          [4, 1, { text: "", color: "#000000" }],
          [5, 1, { text: "", color: "#000000" }],
          [6, 1, { text: "", color: "#000000" }],
        ]), true,
        "Fingering does not match expected strings"
      );
      assert.equal(
        result?.title,
        "",
        "Title should be undefined"
      );
      assert.equal(
        result?.position,
        undefined,
        "Position does not match expected undefined"
      );
      assert.deepEqual(result?.barres, [], "Barres should be empty");
    });

  });
});
