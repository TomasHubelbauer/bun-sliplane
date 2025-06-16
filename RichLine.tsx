import LinkPreview from "./LinkPreview.tsx";
import type { WebSocketProps } from "./WebSocketProps.ts";

type RichLineProps = WebSocketProps & {
  parts: (
    | string
    | { type: "code"; text: string }
    | { type: "link"; url: string }
  )[];
};

export default function RichLine({ parts, send, listen }: RichLineProps) {
  return parts.map((part, index) => {
    if (typeof part === "string") {
      return <span key={index}>{part}</span>;
    }

    switch (part.type) {
      case "link": {
        return (
          <LinkPreview key={index} send={send} listen={listen} url={part.url} />
        );
      }
      case "code": {
        return <code key={index}>{part.text}</code>;
      }
      default: {
        throw new Error(`Unknown part type: ${JSON.stringify(part)}`);
      }
    }
  });
}
