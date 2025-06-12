export default function* segmentLinks(text: string | null | undefined) {
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
      yield { type: "link" as const, url: text };
      return;
    }

    yield { type: "link" as const, url: text.slice(0, spaceIndex) };
    text = text.slice(spaceIndex);
  }
}

if (import.meta.main) {
  for (const { test, expected } of [
    { test: () => segmentLinks(undefined), expected: [] },
    { test: () => segmentLinks(null), expected: [] },
    { test: () => segmentLinks(""), expected: [] },
    {
      test: () => segmentLinks("https://start.com end"),
      expected: [{ type: "link", url: "https://start.com" }, " end"],
    },
    {
      test: () => segmentLinks("start https://end.com"),
      expected: ["start ", { type: "link", url: "https://end.com" }],
    },
    {
      test: () => segmentLinks("start https://mid.com end"),
      expected: ["start ", { type: "link", url: "https://mid.com" }, " end"],
    },
    {
      test: () => segmentLinks("start https://one.com https://two.com end"),
      expected: [
        "start ",
        { type: "link", url: "https://one.com" },
        " ",
        { type: "link", url: "https://two.com" },
        " end",
      ],
    },
    {
      test: () => segmentLinks("start https://one.com mid https://two.com end"),
      expected: [
        "start ",
        { type: "link", url: "https://one.com" },
        " mid ",
        { type: "link", url: "https://two.com" },
        " end",
      ],
    },
    {
      test: () => segmentLinks("https://one.com mid https://two.com end"),
      expected: [
        { type: "link", url: "https://one.com" },
        " mid ",
        { type: "link", url: "https://two.com" },
        " end",
      ],
    },
    {
      test: () => segmentLinks("start https://one.com mid https://two.com"),
      expected: [
        "start ",
        { type: "link", url: "https://one.com" },
        " mid ",
        { type: "link", url: "https://two.com" },
      ],
    },
  ]) {
    const actual = JSON.stringify([...test()]);
    if (actual !== JSON.stringify(expected)) {
      console.log(
        test.toString().slice(`() => ${segmentLinks.name}(`.length, -")".length)
      );
      console.log("\t", actual);
      console.log("\t", JSON.stringify(expected));
    }
  }
}
