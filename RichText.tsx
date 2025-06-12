import { useCallback, useMemo, type MouseEvent, type ReactNode } from "react";
import segmentUrls from "./segmentUrls.ts";
import segmentCodes from "./segmentCodes.ts";

type RichTextProps = {
  text: string;
  fallback: ReactNode;
};

export default function RichText({ text, fallback }: RichTextProps) {
  const parts = useMemo(
    () => [...segmentCodes([...segmentUrls(text)])],
    [text]
  );

  const handleAClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
  }, []);

  return (
    <span>
      {!text && fallback}
      {parts.map((part, index) =>
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
      )}
    </span>
  );
}
