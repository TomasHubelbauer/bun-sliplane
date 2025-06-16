import type { Dispatch, SetStateAction } from "react";
import Tools from "./Tools.tsx";
import Composer from "./Composer.tsx";
import type { Tool } from "./Tool.ts";
import type { Stats } from "./Stats.ts";
import type { WebSocketProps } from "./WebSocketProps.ts";

type HeaderProps = WebSocketProps & {
  draft: string;
  setDraft: Dispatch<SetStateAction<string>>;
  stats: Stats | undefined;
  tool: Tool | undefined;
  setTool: Dispatch<SetStateAction<Tool | undefined>>;
  readyState: number;
};

export default function Header({
  send,
  listen,
  draft,
  setDraft,
  stats,
  tool,
  setTool,
  readyState,
}: HeaderProps) {
  return (
    <div className={Header.name}>
      <Tools
        send={send}
        listen={listen}
        tool={tool}
        setTool={setTool}
        stats={stats}
        readyState={readyState}
      />
      {!tool && (
        <Composer
          send={send}
          listen={listen}
          draft={draft}
          setDraft={setDraft}
        />
      )}
    </div>
  );
}
