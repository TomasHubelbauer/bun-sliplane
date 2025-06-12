import segmentText from "./segmentText";

export default function serializeSegments(
  segments: ReturnType<typeof segmentText>
) {
  let markdown = "";
  for (const segment of segments) {
    switch (segment.type) {
      case "paragraph": {
        markdown += segment.text + "\n";
        break;
      }
      case "code-block": {
        markdown += "```\n" + segment.lines.join("\n") + "\n```\n";
        break;
      }
      case "unordered-list": {
        for (const item of segment.items) {
          markdown += `- ${item.text}\n`;
        }
        markdown += "\n";
        break;
      }
      case "ordered-list": {
        for (let i = 0; i < segment.items.length; i++) {
          markdown += `${i + segment.start}. ${segment.items[i].text}\n`;
        }
        markdown += "\n";
        break;
      }
      default: {
        throw new Error(`Unknown segment type: ${JSON.stringify(segment)}`);
      }
    }
  }

  return markdown.trim();
}

if (import.meta.main) {
  for (const { test, expected } of [
    { test: () => serializeSegments(segmentText("")), expected: "" },
    { test: () => serializeSegments(segmentText("text")), expected: "text" },
    {
      test: () => serializeSegments(segmentText("- one\n- two\n- three")),
      expected: "- one\n- two\n- three",
    },
    {
      test: () => serializeSegments(segmentText("1. one\n2. two\n3. three")),
      expected: "1. one\n2. two\n3. three",
    },
    {
      test: () => serializeSegments(segmentText("one\ntwo\nthree")),
      expected: "one\ntwo\nthree",
    },
    {
      test: () => serializeSegments(segmentText("```\none\ntwo\nthree\n```")),
      expected: "```\none\ntwo\nthree\n```",
    },
    {
      test: () => serializeSegments(segmentText("`code`")),
      expected: "`code`",
    },
    {
      test: () => serializeSegments(segmentText("https://google.com")),
      expected: "https://google.com",
    },
  ]) {
    const actual = JSON.stringify(test());
    if (actual !== JSON.stringify(expected)) {
      console.log(
        test
          .toString()
          .slice(`() => ${serializeSegments.name}(`.length, -")".length)
      );
      console.log("\t", actual);
      console.log("\t", JSON.stringify(expected));
    }
  }
}
