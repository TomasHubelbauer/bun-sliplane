import { test, expect } from "bun:test";
import formatHumanStamp from "./formatHumanStamp.ts";

test("formatHumanStamp - empty string returns undefined", () => {
  expect(formatHumanStamp("")).toBeUndefined();
});

test("formatHumanStamp - current time returns 'now'", () => {
  expect(formatHumanStamp(new Date().toISOString())).toEqual({ word: "now" });
});

test("formatHumanStamp - invalid date returns undefined", () => {
  expect(formatHumanStamp("invalid-date")).toBeUndefined();
});

test("formatHumanStamp - seconds ago", () => {
  const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();
  expect(formatHumanStamp(thirtySecondsAgo)).toEqual({
    number: 30,
    unit: "seconds",
    word: "ago",
  });

  const oneSecondAgo = new Date(Date.now() - 1000).toISOString();
  expect(formatHumanStamp(oneSecondAgo)).toEqual({
    number: 1,
    unit: "second",
    word: "ago",
  });
});

test("formatHumanStamp - minutes ago", () => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  expect(formatHumanStamp(fiveMinutesAgo)).toEqual({
    number: 5,
    unit: "minutes",
    word: "ago",
  });

  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  expect(formatHumanStamp(oneMinuteAgo)).toEqual({
    number: 1,
    unit: "minute",
    word: "ago",
  });
});

test("formatHumanStamp - hours ago", () => {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  expect(formatHumanStamp(twoHoursAgo)).toEqual({
    number: 2,
    unit: "hours",
    word: "ago",
  });

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  expect(formatHumanStamp(oneHourAgo)).toEqual({
    number: 1,
    unit: "hour",
    word: "ago",
  });
});

test("formatHumanStamp - days ago", () => {
  const threeDaysAgo = new Date(
    Date.now() - 3 * 24 * 60 * 60 * 1000
  ).toISOString();
  expect(formatHumanStamp(threeDaysAgo)).toEqual({
    number: 3,
    unit: "days",
    word: "ago",
  });

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  expect(formatHumanStamp(oneDayAgo)).toEqual({
    number: 1,
    unit: "day",
    word: "ago",
  });
});

test("formatHumanStamp - future dates", () => {
  const twoHoursAway = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  expect(formatHumanStamp(twoHoursAway)).toEqual({
    number: 2,
    unit: "hours",
    word: "away",
  });

  const oneDayAway = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  expect(formatHumanStamp(oneDayAway)).toEqual({
    number: 1,
    unit: "day",
    word: "away",
  });
});