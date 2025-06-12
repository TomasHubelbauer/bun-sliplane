import { useCallback, useMemo, type MouseEvent } from "react";
import segmentUrls from "./segmentUrls.ts";
import segmentCodes from "./segmentCodes.ts";

type RichTextProps = {
  text: string;
};

export default function RichText({ text }: RichTextProps) {
  const parts = useMemo(
    () => [...segmentCodes([...segmentUrls(text)])],
    [text]
  );

  const handleAClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
  }, []);

  return (
    <span>
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
            {part.host}
            {part.href.slice(
              part.origin.length,
              -(part.href.endsWith("/") ? 1 : 0)
            )}
          </a>
        ) : (
          <code key={index}>{part.text}</code>
        )
      )}
    </span>
  );
}
