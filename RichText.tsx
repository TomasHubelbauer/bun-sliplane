import { useMemo, type ReactNode } from "react";
import segmentText from "./segmentText.ts";
import RichLine from "./RichLine.tsx";

type RichTextProps = {
  text: string;
  fallback: ReactNode;
};

export default function RichText({ text, fallback }: RichTextProps) {
  const lines = useMemo(() => segmentText(text), [text]);

  return (
    <div>
      {!text && fallback}
      {lines.map((line, index) => {
        switch (line.type) {
          case "paragraph": {
            return (
              <p key={index}>
                <RichLine parts={line.parts} />
              </p>
            );
          }
          case "code-block": {
            return <pre key={index}>{line.text} </pre>;
          }
          case "unordered-list": {
            return (
              <ul key={index}>
                {line.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <RichLine parts={item} />
                  </li>
                ))}
              </ul>
            );
          }
          case "ordered-list": {
            return (
              <ol key={index} start={line.start}>
                {line.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <RichLine parts={item} />
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
