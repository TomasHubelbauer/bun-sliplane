import { test, expect } from "bun:test";
import segmentLines from "./segmentLines.ts";

test("segmentLines - empty string", () => {
  expect([...segmentLines("")]).toEqual([]);
});

test("segmentLines - simple text lines", () => {
  expect([...segmentLines("hello\nworld")]).toEqual(["hello", "world"]);
});

test("segmentLines - unordered list with text before and after", () => {
  expect([...segmentLines("hello\n- item 1\n-item 2\n-item 3\nworld")]).toEqual([
    "hello",
    { type: "unordered-list", items: ["item 1", "item 2", "item 3"] },
    "world",
  ]);
});

test("segmentLines - unordered list at beginning", () => {
  expect([...segmentLines("- item 1\n-item 2\n-item 3\nworld")]).toEqual([
    { type: "unordered-list", items: ["item 1", "item 2", "item 3"] },
    "world",
  ]);
});

test("segmentLines - unordered list at end", () => {
  expect([...segmentLines("hello\n- item 1\n-item 2\n-item 3")]).toEqual([
    "hello",
    { type: "unordered-list", items: ["item 1", "item 2", "item 3"] },
  ]);
});

test("segmentLines - multiple unordered lists", () => {
  expect([...segmentLines("hello\n- item 1\n-item 2\n\n---\n\n-item 1\nworld")]).toEqual([
    "hello",
    { type: "unordered-list", items: ["item 1", "item 2"] },
    "",
    "---",
    "",
    { type: "unordered-list", items: ["item 1"] },
    "world",
  ]);
});

test("segmentLines - ordered list with text before and after", () => {
  expect([...segmentLines("hello\n1. item 1\n2. item 2\n3. item 3\nworld")]).toEqual([
    "hello",
    {
      type: "ordered-list",
      items: ["item 1", "item 2", "item 3"],
      start: 1,
    },
    "world",
  ]);
});

test("segmentLines - ordered list at beginning", () => {
  expect([...segmentLines("1. item 1\n2. item 2\n3. item 3\nworld")]).toEqual([
    {
      type: "ordered-list",
      items: ["item 1", "item 2", "item 3"],
      start: 1,
    },
    "world",
  ]);
});

test("segmentLines - ordered list at end", () => {
  expect([...segmentLines("hello\n1. item 1\n2. item 2\n3. item 3")]).toEqual([
    "hello",
    {
      type: "ordered-list",
      items: ["item 1", "item 2", "item 3"],
      start: 1,
    },
  ]);
});

test("segmentLines - multiple ordered lists", () => {
  expect([...segmentLines("hello\n1. item 1\n2. item 2\n\n---\n\n1. item 1\nworld")]).toEqual([
    "hello",
    { type: "ordered-list", items: ["item 1", "item 2"], start: 1 },
    "",
    "---",
    "",
    { type: "ordered-list", items: ["item 1"], start: 1 },
    "world",
  ]);
});

test("segmentLines - ordered list starting at 3", () => {
  expect([...segmentLines("hello\n3. item 1\n2. item 2\n1. item 3\nworld")]).toEqual([
    "hello",
    {
      type: "ordered-list",
      items: ["item 1", "item 2", "item 3"],
      start: 3,
    },
    "world",
  ]);
});

test("segmentLines - code block with language", () => {
  expect([...segmentLines("hello\n```typescript\nconsole.log('hello, world')\nline 2\nline 3\n```\nworld")]).toEqual([
    "hello",
    {
      type: "code-block",
      language: "typescript",
      lines: ["console.log('hello, world')", "line 2", "line 3"],
    },
    "world",
  ]);
});

test("segmentLines - code block with text after closing backticks", () => {
  expect([...segmentLines("```typescript\nconsole.log('hello, world')\n```world")]).toEqual([
    {
      type: "code-block",
      language: "typescript",
      lines: ["console.log('hello, world')"],
    },
    "world",
  ]);
});

test("segmentLines - code block at end", () => {
  expect([...segmentLines("hello\n```typescript\nconsole.log('hello, world')\n```")]).toEqual([
    "hello",
    {
      type: "code-block",
      language: "typescript",
      lines: ["console.log('hello, world')"],
    },
  ]);
});

test("segmentLines - multiple code blocks", () => {
  expect([...segmentLines("hello\n```typescript\nconsole.log('hello, world')\n```\nworld\nhello\n```javascript\nconsole.log('hello, world')\n```\nworld")]).toEqual([
    "hello",
    {
      type: "code-block",
      language: "typescript",
      lines: ["console.log('hello, world')"],
    },
    "world",
    "hello",
    {
      type: "code-block",
      language: "javascript",
      lines: ["console.log('hello, world')"],
    },
    "world",
  ]);
});