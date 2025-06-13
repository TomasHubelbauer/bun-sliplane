import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from "react";
import Usage from "./Usage.tsx";
import Stamp from "./Stamp.tsx";
import VolumeExplorer from "./VolumeExplorer.tsx";
import DatabaseExplorer from "./DatabaseExplorer.tsx";

type ToolsProps = {
  ws: WebSocket;
};

export default function Tools({ ws }: ToolsProps) {
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
          case "getStats": {
            setStats(data.data);
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
  const [stats, setStats] = useState<{
    bsize: number;
    bfree: number;
    blocks: number;
  }>();

  const [tool, setTool] = useState<"volume-explorer" | "database-explorer">();

  const handleToolResetButtonClick = useCallback(() => {
    setTool(undefined);
  }, []);

  const handleToolButtonClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      setTool(
        event.currentTarget.dataset.tool as
          | "volume-explorer"
          | "database-explorer"
      );
    },
    []
  );

  const lastBackup = useMemo(
    () => audits.find((audit) => audit.name === `backup-${userName}`)?.stamp,
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
        <a href="/backup" target="_blank">
          Backup
          {lastBackup && <Stamp stamp={lastBackup} />}
        </a>
      </div>
      {tool === "volume-explorer" && <VolumeExplorer ws={ws} stats={stats} />}
      {tool === "database-explorer" && <DatabaseExplorer ws={ws} />}
    </>
  );
}
