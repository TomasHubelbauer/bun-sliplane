import type { Dispatch, SetStateAction } from "react";
import Tools from "./Tools.tsx";
import Composer from "./Composer.tsx";

type HeaderProps = {
  ws: WebSocket;
  draft: string;
  setDraft: Dispatch<SetStateAction<string>>;
  stats:
    | {
        bsize: number;
        bfree: number;
        blocks: number;
      }
    | undefined;
  tool: "volume-explorer" | "database-explorer" | undefined;
  setTool: Dispatch<
    SetStateAction<"volume-explorer" | "database-explorer" | undefined>
  >;
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
