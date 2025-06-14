export default function* segmentCodes(
  parts: (string | { type: "link"; url: string })[]
) {
  for (const part of parts) {
    if (typeof part === "string") {
      let i = 0;
      while (i < part.length) {
        const codeStart = part.indexOf("`", i);

        if (codeStart === -1) {
          if (i < part.length) {
            yield part.slice(i);
          }
          break;
        }

        if (codeStart > i) {
          yield part.slice(i, codeStart);
        }

        // Find the end of the code segment, handling escaped backticks
        let codeEnd = codeStart + 1;
        while (codeEnd < part.length) {
          if (part[codeEnd] === "`") {
            // Check if this backtick is escaped
            if (codeEnd > 0 && part[codeEnd - 1] === "\\") {
              codeEnd++;
              continue;
            }
            break;
          }
          codeEnd++;
        }

        if (codeEnd >= part.length) {
          yield { type: "code" as const, text: part.slice(codeStart + 1) };
          break;
        }

        // Extract the code text and unescape backticks
        const codeText = part.slice(codeStart + 1, codeEnd);
        const unescapedText = codeText.replace(/\\`/g, "`");

        yield {
          type: "code" as const,
          text: unescapedText,
        };
        i = codeEnd + 1;
      }
    } else {
      yield part;
    }
  }
}
