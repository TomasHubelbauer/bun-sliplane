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

export default function App() {
  const [draft, setDraft] = useState("");
  const [items, setItems] = useState<ItemType[]>([]);
  const [tool, setTool] = useState<Tool | undefined>();
  const [stats, setStats] = useState<Stats | undefined>();

  const ws = useMemo(() => new WebSocket("/ws"), []);
  const [readState, setReadState] = useState(ws.readyState);

  useEffect(() => {
    const abortController = new AbortController();

    ws.addEventListener(
      "message",
      (event) => {
        const { type, ...data } = JSON.parse(event.data);
        switch (type) {
          case "reportError": {
            alert(`Error: ${data.message}\n\n${data.stack}`);
            break;
          }
          case "getItems": {
            setItems(data.data);
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

    ws.addEventListener("error", () => location.reload(), {
      signal: abortController.signal,
    });

    ws.addEventListener("close", () => location.reload(), {
      signal: abortController.signal,
    });

    const handle = setInterval(() => setReadState(ws.readyState), 1000);

    return () => {
      ws.close();
      abortController.abort();
      clearInterval(handle);
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
        ws={ws}
        draft={draft}
        setDraft={setDraft}
        stats={stats}
        tool={tool}
        setTool={setTool}
        readyState={readState}
      />
      {tool === "volume-explorer" && <VolumeExplorer ws={ws} stats={stats} />}
      {tool === "machine-explorer" && <MachineExplorer ws={ws} />}
      {tool === "database-explorer" && <DatabaseExplorer ws={ws} />}
      {tool == "link-watcher" && <LinkWatcher ws={ws} />}
      {tool && <hr />}
      {matches.length > 0 && `Items matching "${search}":`}
      <List ws={ws} items={matches.length ? matches : items} />
    </>
  );
}
