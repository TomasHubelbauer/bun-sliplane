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

        const codeEnd = part.indexOf("`", codeStart + 1);

        if (codeEnd === -1) {
          yield { type: "code" as const, text: part.slice(codeStart + 1) };
          break;
        }

        yield {
          type: "code" as const,
          text: part.slice(codeStart + 1, codeEnd),
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
