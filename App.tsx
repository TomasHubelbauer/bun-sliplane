import { useEffect, useMemo, useState } from "react";
import type { Item as ItemType } from "./ItemType.ts";
import List from "./List.tsx";
import Header from "./Header.tsx";
import VolumeExplorer from "./VolumeExplorer.tsx";
import DatabaseExplorer from "./DatabaseExplorer.tsx";
import type { Tool } from "./Tool.ts";
import type { Stats } from "./Stats.ts";
import LinkWatcher from "./LinkWatcher.tsx";
import MachineExplorer from "./MachineExplorer.tsx";
import { listen, send, ws } from "./webSocket.ts";

export default function App() {
  const [draft, setDraft] = useState("");
  const [items, setItems] = useState<ItemType[]>([]);
  const [tool, setTool] = useState<Tool | undefined>();
  const [stats, setStats] = useState<Stats | undefined>();

  useEffect(() => {
    const abortController = new AbortController();

    listen(abortController.signal, {
      reportError: (data) => alert(`Error: ${data.message}\n\n${data.stack}`),
      getItems: setItems,
      getStats: setStats,
    });

    send({ type: "getItems" });
    send({ type: "getStats" });
    send({ type: "getAudits" });

    return () => {
      ws.close();
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    document.addEventListener(
      "visibilitychange",
      () => send({ type: "getItems" }),
      { signal: abortController.signal }
    );
    return () => {
      abortController.abort();
    };
  }, []);

  const search = useMemo(() => {
    const search = draft.trim().toUpperCase();
    if (!search || search.includes(" ")) {
      return;
    }

    return search;
  }, [draft]);

  const matches = useMemo(() => {
    return search
      ? items.filter(
          (item) =>
            item.name.toUpperCase().includes(search) ||
            item.text.toUpperCase().includes(search)
        )
      : [];
  }, [items, search]);

  return (
    <>
      <Header
        draft={draft}
        setDraft={setDraft}
        stats={stats}
        tool={tool}
        setTool={setTool}
      />
      {tool === "volume-explorer" && <VolumeExplorer stats={stats} />}
      {tool === "machine-explorer" && <MachineExplorer />}
      {tool === "database-explorer" && <DatabaseExplorer />}
      {tool == "link-watcher" && <LinkWatcher />}
      {tool && <hr />}
      {matches.length > 0 && `Items matching "${search}":`}
      <List items={matches.length ? matches : items} />
    </>
  );
}
