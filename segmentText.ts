import segmentLines from "./segmentLines.ts";
import segmentLinks from "./segmentLinks.ts";
import segmentCodes from "./segmentCodes.ts";

export default function segmentText(text: string) {
  const lines = [...segmentLines(text)];

  return [...lines].map((line) => {
    if (typeof line === "string") {
      return {
        type: "paragraph" as const,
        text: line,

        parts: [...segmentCodes([...segmentLinks(line)])],
      };
    }

    switch (line.type) {
      case "code-block": {
        return line;
      }
      case "unordered-list": {
        return {
          ...line,
          items: line.items.map((item) => {
            return {
              text: item,
              parts: [...segmentCodes([...segmentLinks(item)])],
            };
          }),
        };
      }
      case "ordered-list": {
        return {
          ...line,
          items: line.items.map((item) => {
            return {
              text: item,
              parts: [...segmentCodes([...segmentLinks(item)])],
            };
          }),
        };
      }
      default: {
        throw new Error(`Unknown line type: ${JSON.stringify(line)}`);
      }
    }
  });
}
