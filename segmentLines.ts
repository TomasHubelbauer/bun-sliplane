export default function* segmentLines(text: string) {
  if (!text) return;

  const lines = text.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Handle code blocks
    if (line.startsWith("```")) {
      const language = line.slice(3);
      const codeLines: string[] = [];
      i++;

      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }

      yield {
        type: "code-block" as const,
        language: language || undefined,
        lines: codeLines,
      };

      // Check if there's text after the closing ```
      if (i < lines.length && lines[i].startsWith("```")) {
        const remainingText = lines[i].slice(3);
        if (remainingText) {
          yield remainingText;
        }
        i++;
      }
      continue;
    }

    // Handle unordered lists
    if (
      line.startsWith("- ") ||
      (line.startsWith("-") && line.length > 1 && line[1] !== "-")
    ) {
      const items: string[] = [];

      while (
        i < lines.length &&
        (lines[i].startsWith("- ") ||
          (lines[i].startsWith("-") &&
            lines[i].length > 1 &&
            lines[i][1] !== "-"))
      ) {
        const item = lines[i].startsWith("- ")
          ? lines[i].slice(2)
          : lines[i].slice(1);
        items.push(item);
        i++;
      }

      yield { type: "unordered-list" as const, items };
      continue;
    }

    // Handle ordered lists
    const orderedMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (orderedMatch) {
      const items: string[] = [];
      const startNumber = parseInt(orderedMatch[1]);

      while (i < lines.length) {
        const match = lines[i].match(/^(\d+)\.\s+(.+)$/);
        if (!match) break;
        items.push(match[2]);
        i++;
      }

      const result = { type: "ordered-list" as const, items, start: 1 };
      if (startNumber !== 1) {
        result.start = startNumber;
      }
      yield result;
      continue;
    }

    // Handle plain text lines (including empty lines)
    yield line;
    i++;
  }
}

if (import.meta.main) {
  for (const { test, expected } of [
    { test: () => segmentLines(""), expected: [] },
    { test: () => segmentLines("hello\nworld"), expected: ["hello", "world"] },
    {
      test: () => segmentLines("hello\n- item 1\n-item 2\n-item 3\nworld"),
      expected: [
        "hello",
        { type: "unordered-list", items: ["item 1", "item 2", "item 3"] },
        "world",
      ],
    },
    {
      test: () => segmentLines("- item 1\n-item 2\n-item 3\nworld"),
      expected: [
        { type: "unordered-list", items: ["item 1", "item 2", "item 3"] },
        "world",
      ],
    },
    {
      test: () => segmentLines("hello\n- item 1\n-item 2\n-item 3"),
      expected: [
        "hello",
        { type: "unordered-list", items: ["item 1", "item 2", "item 3"] },
      ],
    },
    {
      test: () =>
        segmentLines("hello\n- item 1\n-item 2\n\n---\n\n-item 1\nworld"),
      expected: [
        "hello",
        { type: "unordered-list", items: ["item 1", "item 2"] },
        "",
        "---",
        "",
        { type: "unordered-list", items: ["item 1"] },
        "world",
      ],
    },
    {
      test: () => segmentLines("hello\n1. item 1\n2. item 2\n3. item 3\nworld"),
      expected: [
        "hello",
        {
          type: "ordered-list",
          items: ["item 1", "item 2", "item 3"],
          start: 1,
        },
        "world",
      ],
    },
    {
      test: () => segmentLines("1. item 1\n2. item 2\n3. item 3\nworld"),
      expected: [
        {
          type: "ordered-list",
          items: ["item 1", "item 2", "item 3"],
          start: 1,
        },
        "world",
      ],
    },
    {
      test: () => segmentLines("hello\n1. item 1\n2. item 2\n3. item 3"),
      expected: [
        "hello",
        {
          type: "ordered-list",
          items: ["item 1", "item 2", "item 3"],
          start: 1,
        },
      ],
    },
    {
      test: () =>
        segmentLines("hello\n1. item 1\n2. item 2\n\n---\n\n1. item 1\nworld"),
      expected: [
        "hello",
        { type: "ordered-list", items: ["item 1", "item 2"], start: 1 },
        "",
        "---",
        "",
        { type: "ordered-list", items: ["item 1"], start: 1 },
        "world",
      ],
    },
    {
      test: () => segmentLines("hello\n3. item 1\n2. item 2\n1. item 3\nworld"),
      expected: [
        "hello",
        {
          type: "ordered-list",
          items: ["item 1", "item 2", "item 3"],
          start: 3,
        },
        "world",
      ],
    },
    {
      test: () =>
        segmentLines(
          "hello\n```typescript\nconsole.log('hello, world')\nline 2\nline 3\n```\nworld"
        ),
      expected: [
        "hello",
        {
          type: "code-block",
          language: "typescript",
          lines: ["console.log('hello, world')", "line 2", "line 3"],
        },
        "world",
      ],
    },
    {
      test: () =>
        segmentLines("```typescript\nconsole.log('hello, world')\n```world"),
      expected: [
        {
          type: "code-block",
          language: "typescript",
          lines: ["console.log('hello, world')"],
        },
        "world",
      ],
    },
    {
      test: () =>
        segmentLines("hello\n```typescript\nconsole.log('hello, world')\n```"),
      expected: [
        "hello",
        {
          type: "code-block",
          language: "typescript",
          lines: ["console.log('hello, world')"],
        },
      ],
    },
    {
      test: () =>
        segmentLines(
          "hello\n```typescript\nconsole.log('hello, world')\n```\nworld\nhello\n```javascript\nconsole.log('hello, world')\n```\nworld"
        ),
      expected: [
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
      ],
    },
  ]) {
    const actual = JSON.stringify([...test()]);
    if (actual !== JSON.stringify(expected)) {
      console.log(
        test.toString().slice(`() => ${segmentLines.name}(`.length, -")".length)
      );
      console.log("\t", actual);
      console.log("\t", JSON.stringify(expected));
    }
  }
}
