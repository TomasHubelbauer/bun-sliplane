import LinkPreview from "./LinkPreview.tsx";

type RichLineProps = {
  ws: WebSocket;
  parts: (
    | string
    | { type: "code"; text: string }
    | { type: "link"; url: string }
  )[];
};

export default function RichLine({ parts, ws }: RichLineProps) {
  return parts.map((part, index) => {
    if (typeof part === "string") {
      return <span key={index}>{part}</span>;
    }

    switch (part.type) {
      case "link": {
        return <LinkPreview key={index} ws={ws} url={part.url} />;
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
