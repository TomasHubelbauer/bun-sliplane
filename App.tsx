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
import formatHumanStamp from "./formatHumanStamp.ts";
import Usage from "./Usage.tsx";

export default function App() {
  const [draft, setDraft] = useState<string>("");
  const [items, setItems] = useState<ItemType[]>([]);
  const [audits, setAudits] = useState<{ name: string; stamp: string }[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    void (async function () {
      setAudits(await fetch("/audits").then((response) => response.json()));

      setStats(await fetch("/stats").then((response) => response.json()));
    })();
  }, []);

  const refreshItems = useCallback(async () => {
    const response = await fetch("/items");
    setItems(await response.json());
  }, []);

  useEffect(() => {
    void refreshItems();

    document.addEventListener("visibilitychange", refreshItems);
    return () => {
      document.removeEventListener("visibilitychange", refreshItems);
    };
  }, [refreshItems]);

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

  const handleBackupAClick = useCallback(async () => {
    setAudits(await fetch("/audits").then((response) => response.json()));
  }, []);

  const lastBackup = useMemo(
    () => audits.find((audit) => audit.name === "backup")?.stamp,
    [audits]
  );

  return (
    <>
      <Composer draft={draft} setDraft={setDraft} onSubmit={refreshItems} />
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
              <a href="/backup" target="_blank" onClick={handleBackupAClick}>
                Backup{lastBackup ? ` (${formatHumanStamp(lastBackup)})` : ""}
              </a>
            </>
          )}
        </legend>
        {tool === "volume-explorer" && <VolumeExplorer stats={stats} />}
        {tool === "database-explorer" && <DatabaseExplorer />}
      </fieldset>
      {matches.length > 0 && `Items matching "${search}":`}
      <List
        items={matches.length ? matches : items}
        refreshItems={refreshItems}
      />
    </>
  );
}
