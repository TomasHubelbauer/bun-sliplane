import { useCallback, type MouseEvent } from "react";

type RichLineProps = {
  parts: (string | { type: "code"; text: string } | URL)[];
};

export default function RichLine({ parts }: RichLineProps) {
  const handleAClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
  }, []);

  return parts.map((part, index) =>
    typeof part === "string" ? (
      part
    ) : part instanceof URL ? (
      <a
        key={index}
        href={part.href}
        target="_blank"
        onClick={handleAClick}
        title={part.href}
      >
        {part.host.slice(
          part.host.startsWith("www.") ? "www.".length : undefined
        )}
        {part.href.slice(
          part.origin.length,
          part.href.endsWith("/") ? -1 : undefined
        )}
      </a>
    ) : (
      <code key={index}>{part.text}</code>
    )
  );
}
