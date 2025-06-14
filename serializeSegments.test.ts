import { test, expect } from "bun:test";
import serializeSegments from "./serializeSegments.ts";
import segmentText from "./segmentText.ts";

test("serializeSegments - empty text", () => {
  expect(serializeSegments(segmentText(""))).toBe("");
});

test("serializeSegments - simple text", () => {
  expect(serializeSegments(segmentText("text"))).toBe("text");
});

test("serializeSegments - unordered list", () => {
  expect(serializeSegments(segmentText("- one\n- two\n- three"))).toBe("- one\n- two\n- three");
});

test("serializeSegments - ordered list", () => {
  expect(serializeSegments(segmentText("1. one\n2. two\n3. three"))).toBe("1. one\n2. two\n3. three");
});

test("serializeSegments - multiple lines", () => {
  expect(serializeSegments(segmentText("one\ntwo\nthree"))).toBe("one\ntwo\nthree");
});

test("serializeSegments - code block", () => {
  expect(serializeSegments(segmentText("```\none\ntwo\nthree\n```"))).toBe("```\none\ntwo\nthree\n```");
});

test("serializeSegments - inline code", () => {
  expect(serializeSegments(segmentText("`code`"))).toBe("`code`");
});

test("serializeSegments - URL", () => {
  expect(serializeSegments(segmentText("https://google.com"))).toBe("https://google.com");
});