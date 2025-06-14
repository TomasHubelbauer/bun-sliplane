import { useCallback, useMemo, type ReactNode, type MouseEvent } from "react";
import segmentText from "./segmentText.ts";
import RichLine from "./RichLine.tsx";
import serializeSegments from "./serializeSegments.ts";

type RichTextProps = {
  ws: WebSocket;
  text: string;
  onChange: (text: string) => void;
  fallback: ReactNode;
};

export default function RichText({
  text,
  onChange,
  fallback,
  ws,
}: RichTextProps) {
  const lines = useMemo(() => segmentText(text), [text]);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const index = +event.currentTarget.dataset.index!;
      const subindex = +event.currentTarget.dataset.subindex!;
      const _lines = structuredClone(lines);
      const line = _lines[index];
      switch (line.type) {
        case "paragraph": {
          const text = prompt(undefined, line.text);
          if (text !== line.text) {
            line.text = text ?? "";
            onChange(serializeSegments(_lines));
          }

          return;
        }
        case "code-block": {
          const codeLine = line.lines[subindex];
          const text = prompt(undefined, codeLine);
          if (text !== codeLine) {
            line.lines[subindex] = text ?? "";
            onChange(serializeSegments(_lines));
          }

          return;
        }
        case "unordered-list": {
          const item = line.items[subindex];
          const text = prompt(undefined, item.text);
          if (text !== item.text) {
            item.text = text ?? "";
            onChange(serializeSegments(_lines));
          }

          return;
        }
        case "ordered-list": {
          const item = line.items[subindex];
          const text = prompt(undefined, item.text);
          if (text !== item.text) {
            item.text = text ?? "";
            onChange(serializeSegments(_lines));
          }

          return;
        }
        default: {
          throw new Error(`Unknown line type: ${JSON.stringify(line)}`);
        }
      }
    },
    [onChange, lines]
  );

  const handleFallbackDivClick = useCallback(() => {
    onChange(prompt(undefined, "") ?? "");
  }, [onChange]);

  return (
    <div className={RichText.name}>
      {!text && fallback && (
        <div onClick={handleFallbackDivClick}>{fallback}</div>
      )}
      {lines.map((line, index) => {
        switch (line.type) {
          case "paragraph": {
            return (
              <p key={index} data-index={index} onClick={handleClick}>
                <RichLine ws={ws} parts={line.parts} />
              </p>
            );
          }
          case "code-block": {
            return (
              <pre key={index}>
                {line.lines.map((codeLine, codeIndex) => (
                  <div
                    key={codeIndex}
                    data-index={index}
                    data-subindex={codeIndex}
                    onClick={handleClick}
                    className={
                      line.language === "diff"
                        ? codeLine.startsWith("-")
                          ? "removed"
                          : codeLine.startsWith("+")
                          ? "added"
                          : ""
                        : ""
                    }
                  >
                    {codeLine}
                  </div>
                ))}
              </pre>
            );
          }
          case "unordered-list": {
            return (
              <ul key={index}>
                {line.items.map((item, itemIndex) => (
                  <li
                    key={itemIndex}
                    data-index={index}
                    data-subindex={itemIndex}
                    onClick={handleClick}
                  >
                    <RichLine ws={ws} parts={item.parts} />
                  </li>
                ))}
              </ul>
            );
          }
          case "ordered-list": {
            return (
              <ol key={index} start={line.start}>
                {line.items.map((item, itemIndex) => (
                  <li
                    key={itemIndex}
                    data-index={index}
                    data-subindex={itemIndex}
                    onClick={handleClick}
                  >
                    <RichLine ws={ws} parts={item.parts} />
                  </li>
                ))}
              </ol>
            );
          }
          default: {
            throw new Error(`Unknown line type: ${JSON.stringify(line)}`);
          }
        }
      })}
    </div>
  );
}
