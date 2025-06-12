import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from "react";
import type { Item as ItemType } from "./ItemType.ts";
import Composer from "./Composer.tsx";
import List from "./List.tsx";
import VolumeExplorer from "./VolumeExplorer.tsx";
import DatabaseExplorer from "./DatabaseExplorer.tsx";
import Usage from "./Usage.tsx";
import Stamp from "./Stamp.tsx";

export default function App() {
  const [draft, setDraft] = useState<string>("");
  const [items, setItems] = useState<ItemType[]>([]);
  const [audits, setAudits] = useState<{ name: string; stamp: string }[]>([]);
  const [stats, setStats] = useState<{
    bsize: number;
    bfree: number;
    blocks: number;
  }>();

  const ws = useMemo(() => new WebSocket("/ws"), []);

  useEffect(() => {
    const abortController = new AbortController();
    ws.addEventListener(
      "message",
      (event) => {
        const { type, ...data } = JSON.parse(event.data);
        switch (type) {
          case "getItems": {
            setItems(data.data);
            break;
          }
          case "getAudits": {
            setAudits(data.data);
            break;
          }
          case "getStats": {
            setStats(data.data);
            break;
          }
        }
      },
      { signal: abortController.signal }
    );

    return () => {
      ws.close();
      abortController.abort();
    };
  }, [ws]);

  useEffect(() => {
    const abortController = new AbortController();
    document.addEventListener(
      "visibilitychange",
      () => ws.send(JSON.stringify({ type: "getItems" })),
      { signal: abortController.signal }
    );
    return () => {
      abortController.abort();
    };
  }, [ws]);

  const search = useMemo(() => {
    const search = draft.trim().toUpperCase();
    if (!search || search.includes(" ")) {
      return;
    }

    return search;
  }, [draft]);

  const matches = useMemo(() => {
    return search
      ? items.filter((item) => item.text.toUpperCase().includes(search))
      : [];
  }, [items, search]);

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
    () => audits.find((audit) => audit.name === "backup")?.stamp,
    [audits]
  );

  return (
    <>
      <Composer ws={ws} draft={draft} setDraft={setDraft} />
      <fieldset>
        <legend>
          {tool && <button onClick={handleToolResetButtonClick}>✕</button>}
          {tool === "volume-explorer" && "Volume Explorer"}
          {tool === "database-explorer" && "Database Explorer"}
          {!tool && (
            <>
              <button
                data-tool="volume-explorer"
                onClick={handleToolButtonClick}
              >
                Volume Explorer {stats && <Usage stats={stats} />}
              </button>
              <button
                data-tool="database-explorer"
                onClick={handleToolButtonClick}
              >
                Database Explorer
              </button>
              <a href="/backup" target="_blank">
                Backup
                {lastBackup ? (
                  <>
                    {" "}
                    (<Stamp stamp={lastBackup} />)
                  </>
                ) : (
                  ""
                )}
              </a>
            </>
          )}
        </legend>
        {tool === "volume-explorer" && <VolumeExplorer ws={ws} stats={stats} />}
        {tool === "database-explorer" && <DatabaseExplorer ws={ws} />}
      </fieldset>
      {matches.length > 0 && `Items matching "${search}":`}
      <List ws={ws} items={matches.length ? matches : items} />
    </>
  );
}
