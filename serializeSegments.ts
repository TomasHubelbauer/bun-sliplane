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
