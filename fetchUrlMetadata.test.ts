import { test, expect } from "bun:test";
import fetchUrlMetadata from "./fetchUrlMetadata.ts";

test("fetchUrlMetadata - Bun blog", async () => {
  const result = await fetchUrlMetadata(null as any, {
    url: "https://bun.sh/blog"
  });

  expect(result.url).toBe("https://bun.sh/blog");
  expect(result.title).toBe("Blog | Bun");
  expect(result.type).toBe("image/vnd.microsoft.icon");
  
  const expectedIcon = await Bun.file("icons/bun.ico").arrayBuffer();
  expect(result.icon).toBe(Buffer.from(expectedIcon).toString("base64"));
});

test("fetchUrlMetadata - VS Code updates", async () => {
  const result = await fetchUrlMetadata(null as any, {
    url: "https://code.visualstudio.com/updates"
  });

  expect(result.url).toBe("https://code.visualstudio.com/updates");
  expect(result.title).toBe("May 2025 (version 1.101)");
  expect(result.type).toBe("image/x-icon");
  
  const expectedIcon = await Bun.file("icons/vscode.ico").arrayBuffer();
  expect(result.icon).toBe(Buffer.from(expectedIcon).toString("base64"));
});

test("fetchUrlMetadata - Alza", async () => {
  const result = await fetchUrlMetadata(null as any, {
    url: "https://www.alza.cz/"
  });

  expect(result.url).toBe("https://www.alza.cz/");
  expect(result.title).toBeUndefined();
  expect(result.type).toBe("image/png");
  
  const expectedIcon = await Bun.file("icons/alza.png").arrayBuffer();
  expect(result.icon).toBe(Buffer.from(expectedIcon).toString("base64"));
});

test("fetchUrlMetadata - Anthropic Claude Code", async () => {
  const result = await fetchUrlMetadata(null as any, {
    url: "https://www.anthropic.com/claude-code"
  });

  expect(result.url).toBe("https://www.anthropic.com/claude-code");
  expect(result.title).toBe("Claude Code: Deep Coding at Terminal Velocity \\ Anthropic");
  expect(result.type).toBe("image/x-icon");
  
  const expectedIcon = await Bun.file("icons/anthropic.ico").arrayBuffer();
  expect(result.icon).toBe(Buffer.from(expectedIcon).toString("base64"));
});

test("fetchUrlMetadata - Hacker News", async () => {
  const result = await fetchUrlMetadata(null as any, {
    url: "https://news.ycombinator.com/"
  });

  expect(result.url).toBe("https://news.ycombinator.com/");
  expect(result.title).toBe("Hacker News");
  expect(result.type).toBe("image/svg+xml");
  
  const expectedIcon = await Bun.file("icons/ycombinator.svg").arrayBuffer();
  expect(result.icon).toBe(Buffer.from(expectedIcon).toString("base64"));
});

test("fetchUrlMetadata - YouTube", async () => {
  const result = await fetchUrlMetadata(null as any, {
    url: "https://www.youtube.com"
  });

  expect(result.url).toBe("https://www.youtube.com");
  expect(result.title).toBe("YouTube");
  expect(result.type).toBe("image/png");
  
  const expectedIcon = await Bun.file("icons/youtube.png").arrayBuffer();
  expect(result.icon).toBe(Buffer.from(expectedIcon).toString("base64"));
});

test("fetchUrlMetadata - Wikipedia", async () => {
  const result = await fetchUrlMetadata(null as any, {
    url: "https://en.wikipedia.org"
  });

  expect(result.url).toBe("https://en.wikipedia.org");
  expect(result.title).toBe("Wikipedia, the free encyclopedia");
  expect(result.type).toBe("image/vnd.microsoft.icon");
  
  const expectedIcon = await Bun.file("icons/wikipedia.ico").arrayBuffer();
  expect(result.icon).toBe(Buffer.from(expectedIcon).toString("base64"));
});