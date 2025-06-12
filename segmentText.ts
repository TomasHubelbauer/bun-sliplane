import segmentLines from "./segmentLines.ts";
import segmentUrls from "./segmentUrls.ts";
import segmentCodes from "./segmentCodes.ts";

export default function segmentText(text: string) {
  const lines = segmentLines(text);

  return [...lines].map((line) => {
    if (typeof line === "string") {
      return {
        type: "paragraph" as const,
        parts: [...segmentCodes([...segmentUrls(line)])],
      };
    }

    switch (line.type) {
      case "code-block": {
        return line;
      }
      case "unordered-list": {
        return {
          type: "unordered-list" as const,
          items: line.items.map((item) => {
            return [...segmentCodes([...segmentUrls(item)])];
          }),
        };
      }
      case "ordered-list": {
        return {
          type: "ordered-list" as const,
          items: line.items.map((item) => {
            return [...segmentCodes([...segmentUrls(item)])];
          }),
        };
      }
      default: {
        throw new Error(`Unknown line type: ${JSON.stringify(line)}`);
      }
    }
  });
}
