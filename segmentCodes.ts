export default function* segmentCodes(parts: (string | URL)[]) {
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

if (import.meta.main) {
  for (const { test, expected } of [
    { test: () => segmentCodes([]), expected: [] },
    {
      test: () => segmentCodes(["Hello, `World`!"]),
      expected: ["Hello, ", { type: "code", text: "World" }, "!"],
    },
    {
      test: () => segmentCodes(["Hello, `W` `o` `r` `l` `d`!"]),
      expected: [
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
      ],
    },
    {
      test: () => segmentCodes(["`start` end"]),
      expected: [{ type: "code", text: "start" }, " end"],
    },
    {
      test: () => segmentCodes(["start `end`"]),
      expected: ["start ", { type: "code", text: "end" }],
    },
    {
      test: () =>
        segmentCodes([new URL("https://google.com"), "Hello, `World`!"]),
      expected: [
        new URL("https://google.com"),
        "Hello, ",
        { type: "code", text: "World" },
        "!",
      ],
    },
    {
      test: () =>
        segmentCodes(["Hello, `World`!", new URL("https://google.com")]),
      expected: [
        "Hello, ",
        { type: "code", text: "World" },
        "!",
        new URL("https://google.com"),
      ],
    },
    {
      test: () => segmentCodes(["start `\\`escaped\\`` end"]),
      expected: ["start ", { type: "code", text: "`escaped`" }, " end"],
    },
    {
      test: () =>
        segmentCodes(["start `start \\`escaped\\` \\`escaped 2\\` end` end"]),
      expected: [
        "start ",
        { type: "code", text: "start `escaped` `escaped 2` end" },
        " end",
      ],
    },
  ]) {
    const actual = JSON.stringify([...test()]);
    if (actual !== JSON.stringify(expected)) {
      console.log(
        test.toString().slice(`() => ${segmentCodes.name}(`.length, -")".length)
      );
      console.log("\t", actual);
      console.log("\t", JSON.stringify(expected));
    }
  }
}
