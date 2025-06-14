import type { Dispatch, SetStateAction } from "react";
import Tools from "./Tools.tsx";
import Composer from "./Composer.tsx";
import type { Tool } from "./Tool.ts";
import type { Stats } from "./Stats.ts";

type HeaderProps = {
  ws: WebSocket;
  draft: string;
  setDraft: Dispatch<SetStateAction<string>>;
  stats: Stats | undefined;
  tool: Tool | undefined;
  setTool: Dispatch<SetStateAction<Tool | undefined>>;
};

export default function Header({
  ws,
  draft,
  setDraft,
  stats,
  tool,
  setTool,
}: HeaderProps) {
  return (
    <div className={Header.name}>
      <Tools ws={ws} tool={tool} setTool={setTool} stats={stats} />
      {!tool && <Composer ws={ws} draft={draft} setDraft={setDraft} />}
    </div>
  );
}
