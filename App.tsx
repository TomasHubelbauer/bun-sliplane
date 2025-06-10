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
import formatHumanBytes from "./formatHumanBytes.ts";

export default function App() {
  const [draft, setDraft] = useState<string>("");
  const [password, setPassword] = useState<string | null>(
    localStorage.getItem("password")
  );

  const [items, setItems] = useState<ItemType[]>([]);
  const [audits, setAudits] = useState<{ name: string; stamp: string }[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    void (async function () {
      setAudits(
        await fetch(`/${password}/audits`).then((response) => response.json())
      );

      setStats(
        await fetch(`/${password}/stats`).then((response) => response.json())
      );
    })();
  }, []);

  const refreshItems = useCallback(async () => {
    if (!password) {
      setItems([]);
      return;
    }

    const response = await fetch(`/${password}`);
    setItems(await response.json());
  }, [password]);

  useEffect(() => {
    void refreshItems();

    document.addEventListener("visibilitychange", refreshItems);
    return () => {
      document.removeEventListener("visibilitychange", refreshItems);
    };
  }, [refreshItems]);

  const handleLogoutButtonClick = useCallback(async () => {
    if (!confirm("Are you sure you want to log out?")) {
      return;
    }

    localStorage.removeItem("password");
    setPassword(null);
    setItems([]);
    await refreshItems();
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
    setAudits(
      await fetch(`/${password}/audits`).then((response) => response.json())
    );
  }, [password]);

  const lastBackup = useMemo(
    () => audits.find((audit) => audit.name === "backup")?.stamp,
    [audits]
  );

  return (
    <>
      <Composer
        draft={draft}
        setDraft={setDraft}
        password={password}
        setPassword={setPassword}
        onSubmit={refreshItems}
      />
      <fieldset>
        <legend>
          {tool && <button onClick={handleToolResetButtonClick}>✕</button>}
          {tool === "volume-explorer" && "Volume explorer"}
          {tool === "database-explorer" && "Database explorer"}
          {!tool && (
            <>
              <button
                data-tool="volume-explorer"
                onClick={handleToolButtonClick}
              >
                Volume explorer
              </button>
              <button
                data-tool="database-explorer"
                onClick={handleToolButtonClick}
              >
                Database explorer
              </button>
            </>
          )}
        </legend>
        {tool === "volume-explorer" && password && (
          <VolumeExplorer password={password} />
        )}
        {tool === "database-explorer" && password && (
          <DatabaseExplorer password={password} />
        )}
      </fieldset>
      {matches.length > 0 && `Items matching "${search}":`}
      {password && (
        <>
          <List
            items={matches.length ? matches : items}
            password={password}
            refreshItems={refreshItems}
          />
          <div className="controls">
            <a
              href={`/${password}/backup`}
              target="_blank"
              onClick={handleBackupAClick}
            >
              Backup{lastBackup ? ` (${formatHumanStamp(lastBackup)})` : ""}
            </a>
            {stats &&
              JSON.stringify({
                free: formatHumanBytes(stats.bsize * stats.bfree),
                size: formatHumanBytes(stats.bsize * stats.blocks),
                ratio: ((stats.bfree / stats.blocks) * 100).toFixed(2) + "%",
              })}
            <button onClick={handleLogoutButtonClick}>Log out</button>
          </div>
        </>
      )}
    </>
  );
}
