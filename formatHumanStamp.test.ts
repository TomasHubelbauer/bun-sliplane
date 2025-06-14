import { test, expect } from "bun:test";
import formatHumanStamp from "./formatHumanStamp.ts";

test("formatHumanStamp - empty string returns empty", () => {
  expect(formatHumanStamp("")).toBe("");
});

test("formatHumanStamp - current time returns 'now'", () => {
  expect(formatHumanStamp(new Date().toISOString())).toBe("now");
});

test("formatHumanStamp - invalid date returns empty", () => {
  expect(formatHumanStamp("invalid-date")).toBe("");
});

test("formatHumanStamp - seconds ago", () => {
  const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();
  expect(formatHumanStamp(thirtySecondsAgo)).toBe("30 seconds ago");

  const oneSecondAgo = new Date(Date.now() - 1000).toISOString();
  expect(formatHumanStamp(oneSecondAgo)).toBe("1 second ago");
});

test("formatHumanStamp - minutes ago", () => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  expect(formatHumanStamp(fiveMinutesAgo)).toBe("5 minutes ago");

  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  expect(formatHumanStamp(oneMinuteAgo)).toBe("1 minute ago");
});

test("formatHumanStamp - hours ago", () => {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  expect(formatHumanStamp(twoHoursAgo)).toBe("2 hours ago");

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  expect(formatHumanStamp(oneHourAgo)).toBe("1 hour ago");
});

test("formatHumanStamp - days ago", () => {
  const threeDaysAgo = new Date(
    Date.now() - 3 * 24 * 60 * 60 * 1000
  ).toISOString();
  expect(formatHumanStamp(threeDaysAgo)).toBe("3 days ago");

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  expect(formatHumanStamp(oneDayAgo)).toBe("1 day ago");
});
