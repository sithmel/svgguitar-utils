// @ts-check

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import layoutChordStrings from "../lib/layoutChordStrings.js";

describe("layoutChordStrings", () => {
  test("handles empty string list", () => {
    const result = layoutChordStrings([], 3);
    const expected = "";
    assert.equal(result, expected);
  });

  test("handles single string", () => {
    const strings = ["ABC\nDEF"];
    const result = layoutChordStrings(strings, 1);
    const expected = `ABC
DEF`;
    assert.equal(result, expected);
  });

  test("handles single string with multiple columns", () => {
    const strings = ["ABC"];
    const result = layoutChordStrings(strings, 3);
    const expected = "ABC";
    assert.equal(result, expected);
  });

  test("layouts two strings of equal size in one row", () => {
    const strings = ["ABC\nDEF", "123\n456"];
    const result = layoutChordStrings(strings, 2);
    const expected = `ABC 123
DEF 456`;
    assert.equal(result, expected);
  });

  test("layouts two strings of different widths", () => {
    const strings = ["A\nB", "12345\n67890"];
    const result = layoutChordStrings(strings, 2);
    const expected = `A     12345
B     67890`;
    assert.equal(result, expected);
  });

  test("layouts two strings of different heights", () => {
    const strings = ["A\nB\nC", "12\n34"];
    const result = layoutChordStrings(strings, 2);
    const expected = `A  12
B  34
C`;
    assert.equal(result, expected);
  });

  test("layouts strings into multiple rows", () => {
    const strings = ["A", "B", "C", "D"];
    const result = layoutChordStrings(strings, 2);
    const expected = `A  B

C  D`;
    assert.equal(result, expected);
  });

  test("layouts strings into multiple rows with different sizes", () => {
    const strings = ["ABC\nDEF", "12", "XY\nZ", "!"];
    const result = layoutChordStrings(strings, 2);
    const expected = `ABC 12
DEF

XY  !
Z`;
    assert.equal(result, expected);
  });

  test("handles three columns", () => {
    const strings = ["A", "B", "C", "D", "E", "F"];
    const result = layoutChordStrings(strings, 3);
    const expected = `A  B  C

D  E  F`;
    assert.equal(result, expected);
  });

  test("layouts with incomplete last row", () => {
    const strings = ["A\nB", "C\nD", "E\nF", "G\nH", "I\nJ"];
    const result = layoutChordStrings(strings, 3);
    const expected = `A  C  E
B  D  F

G  I
H  J`;
    assert.equal(result, expected);
  });

  test("pads strings to match the tallest string in their row", () => {
    const strings = ["A", "B\nC\nD", "E"];
    const result = layoutChordStrings(strings, 3);
    const expected = `A  B  E
   C
   D`;
    assert.equal(result, expected);
  });

  test("pads strings to match the widest string in their column", () => {
    const strings = ["A", "LONGTEXT", "B", "X"];
    const result = layoutChordStrings(strings, 2);
    const expected = `A        LONGTEXT

B        X`;
    assert.equal(result, expected);
  });

  test("handles single character strings in grid", () => {
    const strings = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
    const result = layoutChordStrings(strings, 3);
    const expected = `A  B  C

D  E  F

G  H  I`;
    assert.equal(result, expected);
  });

  test("handles multiline strings with varying line lengths", () => {
    const strings = [
      "A\nBB\nCCC",
      "1\n22\n333\n4444",
      "X"
    ];
    const result = layoutChordStrings(strings, 2);
    const expected = `A    1
BB   22
CCC  333
     4444

X`;
    assert.equal(result, expected);
  });

  test("defaults to 3 columns when not specified", () => {
    const strings = ["A", "B", "C", "D", "E", "F"];
    const result = layoutChordStrings(strings);
    const expected = `A  B  C

D  E  F`;
    assert.equal(result, expected);
  });

  test("handles single column layout", () => {
    const strings = ["ABC", "DEF", "GHI"];
    const result = layoutChordStrings(strings, 1);
    const expected = `ABC

DEF

GHI`;
    assert.equal(result, expected);
  });

  test("handles strings with trailing newlines", () => {
    const strings = ["A\n", "B\n"];
    const result = layoutChordStrings(strings, 2);
    const expected = `A  B`;
    assert.equal(result, expected);
  });

  test("handles empty strings in the array", () => {
    const strings = ["", "B", ""];
    const result = layoutChordStrings(strings, 3);
    const expected = `B`;
    assert.equal(result, expected);
  });
});