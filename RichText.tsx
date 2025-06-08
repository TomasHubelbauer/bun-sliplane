import { useCallback, type MouseEvent } from "react";

type RichTextProps = {
  parts: (string | URL)[];
};

export default function RichText({ parts }: RichTextProps) {
  const handleAClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
  }, []);

  return (
    <span>
      {parts.map((part, index) =>
        typeof part === "string" ? (
          part
        ) : (
          <a
            key={index}
            href={part.href}
            target="_blank"
            onClick={handleAClick}
          >
            {part.href}
          </a>
        )
      )}
    </span>
  );
}
