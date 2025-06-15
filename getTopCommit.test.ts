import { test, expect } from "bun:test";
import { $ } from "bun";
import getTopCommit from "./getTopCommit.ts";

test("getTopCommit - matches git log output", async () => {
  // Get the actual git log output for comparison
  const gitOutput = await $`git log --oneline -1`.text();
  const gitMatch = gitOutput.match(/^(?<hash>\w{7}) (?<text>.+)\n?$/);
  
  if (!gitMatch?.groups) {
    throw new Error("Failed to parse git log output");
  }
  
  const result = await getTopCommit();
  
  expect(result.hash).toBe(gitMatch.groups.hash);
  expect(result.text).toBe(gitMatch.groups.text);
});

test("getTopCommit - returns object with hash and text", async () => {
  const result = await getTopCommit();
  
  expect(result).toHaveProperty("hash");
  expect(result).toHaveProperty("text");
  expect(result.hash).toHaveLength(7);
  expect(typeof result.text).toBe("string");
  expect(result.text.length).toBeGreaterThan(0);
});