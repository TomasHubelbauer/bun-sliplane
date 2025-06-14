import { test, expect } from "bun:test";
import segmentCodes from "./segmentCodes.ts";

test("segmentCodes - empty array", () => {
  expect([...segmentCodes([])]).toEqual([]);
});

test("segmentCodes - simple code segment", () => {
  expect([...segmentCodes(["Hello, `World`!"])]).toEqual([
    "Hello, ",
    { type: "code", text: "World" },
    "!",
  ]);
});

test("segmentCodes - multiple code segments", () => {
  expect([...segmentCodes(["Hello, `W` `o` `r` `l` `d`!"])]).toEqual([
    "Hello, ",
    { type: "code", text: "W" },
    " ",
    { type: "code", text: "o" },
    " ",
    { type: "code", text: "r" },
    " ",
    { type: "code", text: "l" },
    " ",
    { type: "code", text: "d" },
    "!",
  ]);
});

test("segmentCodes - code at start", () => {
  expect([...segmentCodes(["`start` end"])]).toEqual([
    { type: "code", text: "start" },
    " end",
  ]);
});

test("segmentCodes - code at end", () => {
  expect([...segmentCodes(["start `end`"])]).toEqual([
    "start ",
    { type: "code", text: "end" },
  ]);
});

test("segmentCodes - with link before text", () => {
  expect([...segmentCodes([
    { type: "link", url: "https://google.com" },
    "Hello, `World`!",
  ])]).toEqual([
    { type: "link", url: "https://google.com" },
    "Hello, ",
    { type: "code", text: "World" },
    "!",
  ]);
});

test("segmentCodes - with link after text", () => {
  expect([...segmentCodes([
    "Hello, `World`!",
    { type: "link", url: "https://google.com" },
  ])]).toEqual([
    "Hello, ",
    { type: "code", text: "World" },
    "!",
    { type: "link", url: "https://google.com" },
  ]);
});

test("segmentCodes - escaped backticks", () => {
  expect([...segmentCodes(["start `\\`escaped\\`` end"])]).toEqual([
    "start ",
    { type: "code", text: "`escaped`" },
    " end",
  ]);
});

test("segmentCodes - multiple escaped backticks", () => {
  expect([...segmentCodes(["start `start \\`escaped\\` \\`escaped 2\\` end` end"])]).toEqual([
    "start ",
    { type: "code", text: "start `escaped` `escaped 2` end" },
    " end",
  ]);
});