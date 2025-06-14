import { test, expect } from "bun:test";
import segmentLinks from "./segmentLinks.ts";

test("segmentLinks - undefined", () => {
  expect([...segmentLinks(undefined)]).toEqual([]);
});

test("segmentLinks - null", () => {
  expect([...segmentLinks(null)]).toEqual([]);
});

test("segmentLinks - empty string", () => {
  expect([...segmentLinks("")]).toEqual([]);
});

test("segmentLinks - link at start", () => {
  expect([...segmentLinks("https://start.com end")]).toEqual([
    { type: "link", url: "https://start.com" },
    " end",
  ]);
});

test("segmentLinks - link at end", () => {
  expect([...segmentLinks("start https://end.com")]).toEqual([
    "start ",
    { type: "link", url: "https://end.com" },
  ]);
});

test("segmentLinks - link in middle", () => {
  expect([...segmentLinks("start https://mid.com end")]).toEqual([
    "start ",
    { type: "link", url: "https://mid.com" },
    " end",
  ]);
});

test("segmentLinks - two consecutive links", () => {
  expect([...segmentLinks("start https://one.com https://two.com end")]).toEqual([
    "start ",
    { type: "link", url: "https://one.com" },
    " ",
    { type: "link", url: "https://two.com" },
    " end",
  ]);
});

test("segmentLinks - two links with text between", () => {
  expect([...segmentLinks("start https://one.com mid https://two.com end")]).toEqual([
    "start ",
    { type: "link", url: "https://one.com" },
    " mid ",
    { type: "link", url: "https://two.com" },
    " end",
  ]);
});

test("segmentLinks - links at start and middle", () => {
  expect([...segmentLinks("https://one.com mid https://two.com end")]).toEqual([
    { type: "link", url: "https://one.com" },
    " mid ",
    { type: "link", url: "https://two.com" },
    " end",
  ]);
});

test("segmentLinks - links at middle and end", () => {
  expect([...segmentLinks("start https://one.com mid https://two.com")]).toEqual([
    "start ",
    { type: "link", url: "https://one.com" },
    " mid ",
    { type: "link", url: "https://two.com" },
  ]);
});