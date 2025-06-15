import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type MouseEvent,
  type SetStateAction,
} from "react";
import Usage from "./Usage.tsx";
import Stamp from "./Stamp.tsx";
import type { Tool } from "./Tool.ts";
import type { Stats } from "./Stats.ts";

type ToolsProps = {
  ws: WebSocket;
  stats: Stats | undefined;
  tool: Tool | undefined;
  setTool: Dispatch<SetStateAction<Tool | undefined>>;
};

export default function Tools({ ws, stats, tool, setTool }: ToolsProps) {
  useEffect(() => {
    const abortController = new AbortController();
    ws.addEventListener(
      "message",
      (event) => {
        const { type, ...data } = JSON.parse(event.data);
        switch (type) {
          case "getAudits": {
            setAudits(data.data);
            break;
          }

          case "getUserName": {
            setUserName(data.data);
            break;
          }
        }
      },
      { signal: abortController.signal }
    );

    ws.addEventListener(
      "open",
      () => ws.send(JSON.stringify({ type: "getUserName" })),
      { signal: abortController.signal }
    );

    return () => {
      abortController.abort();
    };
  }, [ws]);

  const [userName, setUserName] = useState<string>();
  const [audits, setAudits] = useState<{ name: string; stamp: string }[]>([]);

  const handleToolResetButtonClick = useCallback(() => {
    setTool(undefined);
  }, [setTool]);

  const handleToolButtonClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      setTool(
        event.currentTarget.dataset.tool as
          | "volume-explorer"
          | "database-explorer"
      );
    },
    [setTool]
  );

  const lastBackup = useMemo(
    () => audits.find((audit) => audit.name === `backup-${userName}`)?.stamp,
    [audits, userName]
  );

  const lastLinkCheck = useMemo(
    () =>
      audits.find((audit) => audit.name === `link-check-${userName}`)?.stamp,
    [audits, userName]
  );

  return (
    <>
      <div className={Tools.name}>
        {tool && <button onClick={handleToolResetButtonClick}>✕</button>}
        <button
          data-tool="volume-explorer"
          onClick={handleToolButtonClick}
          disabled={tool === "volume-explorer"}
        >
          Volume Explorer {stats && <Usage stats={stats} />}
        </button>
        <button
          data-tool="database-explorer"
          onClick={handleToolButtonClick}
          disabled={tool === "database-explorer"}
        >
          Database Explorer
        </button>
        <button
          data-tool="link-watcher"
          onClick={handleToolButtonClick}
          disabled={tool === "link-watcher"}
        >
          Link Watcher
          {lastLinkCheck && <Stamp stamp={lastLinkCheck} />}
        </button>
        <a href="/backup" target="_blank">
          Backup
          {lastBackup && <Stamp stamp={lastBackup} />}
        </a>
      </div>
    </>
  );
}
