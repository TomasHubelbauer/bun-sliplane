import { useCallback, type MouseEvent } from "react";

type RichLineProps = {
  parts: (
    | string
    | { type: "code"; text: string }
    | { type: "link"; url: string }
  )[];
};

export default function RichLine({ parts }: RichLineProps) {
  const handleAClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
  }, []);

  return parts.map((part, index) => {
    if (typeof part === "string") {
      return <span key={index}>{part}</span>;
    }

    switch (part.type) {
      case "link": {
        const url = new URL(part.url);
        return (
          <a
            key={index}
            href={url.href}
            target="_blank"
            onClick={handleAClick}
            title={url.href}
          >
            {url.host.slice(
              url.host.startsWith("www.") ? "www.".length : undefined
            )}
            {url.href.slice(
              url.origin.length,
              url.href.endsWith("/") ? -1 : undefined
            )}
          </a>
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
