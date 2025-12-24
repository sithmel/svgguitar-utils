// @ts-check

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import splitStringInRectangles from "../lib/splitStringInRectangles.js";

describe("splitStringInRectangles", () => {
  test("should return empty array for empty string", () => {
    const result = splitStringInRectangles("");
    assert.deepEqual(result, []);
  });

  test("should return empty array for string with only spaces", () => {
    const result = splitStringInRectangles("   \n   \n   ");
    assert.deepEqual(result, []);
  });

  test("should extract single rectangle", () => {
    const input = "ABC\nDEF\nGHI";
    const result = splitStringInRectangles(input);
    assert.deepEqual(result, ["ABC\nDEF\nGHI"]);
  });

  test("should extract two rectangles separated horizontally", () => {
    const input = "ABC   XYZ\nDEF   UVW";
    const result = splitStringInRectangles(input);
    assert.equal(result.length, 2);
    assert.ok(result.includes("ABC\nDEF"));
    assert.ok(result.includes("XYZ\nUVW"));
  });

  test("should extract two rectangles separated vertically", () => {
    const input = "ABC\nDEF\n\nXYZ\nUVW";
    const result = splitStringInRectangles(input);
    assert.equal(result.length, 2);
    assert.ok(result.includes("ABC\nDEF"));
    assert.ok(result.includes("XYZ\nUVW"));
  });

  test("should treat diagonally adjacent characters as one rectangle", () => {
    const input = "A  \n B \n  C";
    const result = splitStringInRectangles(input);
    assert.equal(result.length, 1);
    assert.equal(result[0], "A  \n B \n  C");
  });

  test("should extract multiple rectangles in complex layout", () => {
    const input = "AA    BB\nAA    BB\n\n  CC\n  CC";
    const result = splitStringInRectangles(input);
    assert.equal(result.length, 3);
    assert.ok(result.includes("AA\nAA"));
    assert.ok(result.includes("BB\nBB"));
    assert.ok(result.includes("CC\nCC"));
  });

  test("should handle single character", () => {
    const input = "X";
    const result = splitStringInRectangles(input);
    assert.deepEqual(result, ["X"]);
  });

  test("should handle single line with multiple rectangles", () => {
    const input = "ABC   DEF   GHI";
    const result = splitStringInRectangles(input);
    assert.equal(result.length, 3);
    assert.ok(result.includes("ABC"));
    assert.ok(result.includes("DEF"));
    assert.ok(result.includes("GHI"));
  });

  test("should extract rectangles with varying heights", () => {
    const input = "A\nA\nA\n\nBB\nBB";
    const result = splitStringInRectangles(input);
    assert.equal(result.length, 2);
    assert.ok(result.includes("A\nA\nA"));
    assert.ok(result.includes("BB\nBB"));
  });

  test("should handle rectangle at different positions", () => {
    const input = "    X\n    X\n    X";
    const result = splitStringInRectangles(input);
    assert.equal(result.length, 1);
    assert.equal(result[0], "X\nX\nX");
  });

  test("should handle complex diagonal connections", () => {
    const input = "A   E\n B D \n  C  ";
    const result = splitStringInRectangles(input);
    assert.equal(result.length, 1);
  });

  test("should extract non-rectangular shapes as bounding rectangles", () => {
    const input = "A \n A";
    const result = splitStringInRectangles(input);
    assert.equal(result.length, 1);
    assert.equal(result[0], "A \n A");
  });
})