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
import formatHumanBytes from "./formatHumanBytes.ts";
import type { WebSocketProps } from "./WebSocketProps.ts";

type ToolsProps = WebSocketProps & {
  stats: Stats | undefined;
  tool: Tool | undefined;
  setTool: Dispatch<SetStateAction<Tool | undefined>>;
  readyState?: number;
};

export default function Tools({
  send,
  listen,
  stats,
  tool,
  setTool,
  readyState,
}: ToolsProps) {
  const [dbSize, setDbSize] = useState<number>();

  useEffect(() => {
    const abortController = new AbortController();

    listen(abortController.signal, {
      calculateDatabaseSize: setDbSize,
      getUserName: setUserName,
      getAudits: setAudits,
      // Watch the link check log even when Link Watcher is not open
      reportLinkCheckLog: (data: string) => {
        const log = localStorage.getItem("linkCheckLog") || "";
        localStorage.setItem(
          "linkCheckLog",
          `${new Date().toISOString()}: ${data}\n${log}`
        );
      },
    });

    send({ type: "getUserName" });
    send({ type: "getAudits" });
    send({ type: "calculateDatabaseSize" });

    return () => {
      abortController.abort();
    };
  }, [send, listen]);

  const [userName, setUserName] = useState<string>();
  const [audits, setAudits] = useState<{ name: string; stamp: string }[]>([]);

  const handleToolResetButtonClick = useCallback(() => {
    setTool(undefined);
  }, [setTool]);

  const handleToolButtonClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      setTool(event.currentTarget.dataset.tool as Tool | undefined);
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

  const readyStateName = useMemo(() => {
    switch (readyState) {
      case WebSocket.CONNECTING:
        return "connecting";
      case WebSocket.OPEN:
        return "open";
      case WebSocket.CLOSING:
        return "closing";
      case WebSocket.CLOSED:
        return "closed";
      default:
        return "unknown";
    }
  }, [readyState]);

  const [readyStateStamp, setReadyStateStamp] = useState(
    new Date().toISOString()
  );

  useEffect(() => {
    setReadyStateStamp(new Date().toISOString());
  }, [readyState]);

  return (
    <>
      <div className={Tools.name}>
        {tool && <button onClick={handleToolResetButtonClick}>✕</button>}
        <button
          data-tool="volume-explorer"
          onClick={handleToolButtonClick}
          disabled={tool === "volume-explorer"}
        >
          Volume Explorer {stats && <Usage {...stats} />}
        </button>
        <button
          data-tool="machine-explorer"
          onClick={handleToolButtonClick}
          disabled={tool === "machine-explorer"}
        >
          Machine Explorer
        </button>
        <button
          data-tool="database-explorer"
          onClick={handleToolButtonClick}
          disabled={tool === "database-explorer"}
        >
          Database Explorer
          {dbSize && <span className="muted">{formatHumanBytes(dbSize)}</span>}
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
        ·
        <span className={`led ${readyStateName}`} title={readyStateName} />
        {readyStateName}
        <Stamp stamp={readyStateStamp} />
      </div>
    </>
  );
}
