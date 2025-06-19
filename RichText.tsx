import { useCallback, useMemo, type ReactNode, type MouseEvent } from "react";
import segmentText from "./segmentText.ts";
import RichLine from "./RichLine.tsx";
import serializeSegments from "./serializeSegments.ts";

type RichTextProps = {
  text: string;
  onChange: (text: string) => void;
  fallback: ReactNode;
  multiLine?: boolean;
};

export default function RichText({
  text,
  onChange,
  fallback,
  multiLine,
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
          if (text !== null && text !== line.text) {
            line.text = text ?? "";
            onChange(serializeSegments(_lines));
          }

          return;
        }
        case "code-block": {
          const codeLine = line.lines[subindex];
          const text = prompt(undefined, codeLine);
          if (text !== null && text !== codeLine) {
            line.lines[subindex] = text ?? "";
            onChange(serializeSegments(_lines));
          }

          return;
        }
        case "unordered-list": {
          const item = line.items[subindex];
          const text = prompt(undefined, item.text);
          if (text !== null && text !== item.text) {
            item.text = text ?? "";
            onChange(serializeSegments(_lines));
          }

          return;
        }
        case "ordered-list": {
          const item = line.items[subindex];
          const text = prompt(undefined, item.text);
          if (text !== null && text !== item.text) {
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
    const value = prompt(undefined, "");
    if (value !== null) {
      onChange(value);
    }
  }, [onChange]);

  const handleNewLineButtonClick = useCallback(() => {
    const value = prompt(undefined, "");
    if (value !== null) {
      const _lines = structuredClone(lines);
      _lines.push(...segmentText(value));
      onChange(serializeSegments(_lines));
    }
  }, [onChange, lines]);

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
                <RichLine parts={line.parts} />
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
                    <RichLine parts={item.parts} />
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
                    <RichLine parts={item.parts} />
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
      {multiLine && <button onClick={handleNewLineButtonClick}>+</button>}
    </div>
  );
}
