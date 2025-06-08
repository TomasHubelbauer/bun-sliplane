export default function* segmentUrls(text: string | null | undefined) {
  if (!text) {
    return [];
  }

  const regex = /https?:\/\//;

  while (text.length > 0) {
    const index = text.search(regex);

    if (index === -1) {
      yield text;
      return;
    }

    if (index > 0) {
      yield text.slice(0, index);
      text = text.slice(index);
    }

    const spaceIndex = text.indexOf(" ");
    if (spaceIndex === -1) {
      yield new URL(text);
      return;
    }

    yield new URL(text.slice(0, spaceIndex));
    text = text.slice(spaceIndex);
  }
}

if (import.meta.main) {
  for (const { test, expected } of [
    { test: () => segmentUrls(undefined), expected: [] },
    { test: () => segmentUrls(null), expected: [] },
    { test: () => segmentUrls(""), expected: [] },
    {
      test: () => segmentUrls("https://start.com end"),
      expected: [new URL("https://start.com"), " end"],
    },
    {
      test: () => segmentUrls("start https://end.com"),
      expected: ["start ", new URL("https://end.com")],
    },
    {
      test: () => segmentUrls("start https://mid.com end"),
      expected: ["start ", new URL("https://mid.com"), " end"],
    },
    {
      test: () => segmentUrls("start https://one.com https://two.com end"),
      expected: [
        "start ",
        new URL("https://one.com"),
        " ",
        new URL("https://two.com"),
        " end",
      ],
    },
    {
      test: () => segmentUrls("start https://one.com mid https://two.com end"),
      expected: [
        "start ",
        new URL("https://one.com"),
        " mid ",
        new URL("https://two.com"),
        " end",
      ],
    },
    {
      test: () => segmentUrls("https://one.com mid https://two.com end"),
      expected: [
        new URL("https://one.com"),
        " mid ",
        new URL("https://two.com"),
        " end",
      ],
    },
    {
      test: () => segmentUrls("start https://one.com mid https://two.com"),
      expected: [
        "start ",
        new URL("https://one.com"),
        " mid ",
        new URL("https://two.com"),
      ],
    },
  ]) {
    const actual = JSON.stringify([...test()]);
    if (actual !== JSON.stringify(expected)) {
      console.log(
        test.toString().slice(`() => ${segmentUrls.name}(`.length, -")".length)
      );
      console.log("\t", actual);
      console.log("\t", JSON.stringify(expected));
    }
  }
}
