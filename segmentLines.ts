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
