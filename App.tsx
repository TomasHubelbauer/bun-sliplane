import { useEffect, useMemo, useState } from "react";
import type { Item as ItemType } from "./ItemType.ts";
import List from "./List.tsx";
import Header from "./Header.tsx";
import VolumeExplorer from "./VolumeExplorer.tsx";
import DatabaseExplorer from "./DatabaseExplorer.tsx";

export default function App() {
  const [draft, setDraft] = useState<string>("");
  const [items, setItems] = useState<ItemType[]>([]);
  const [tool, setTool] = useState<"volume-explorer" | "database-explorer">();
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

  return (
    <>
      <Header
        ws={ws}
        draft={draft}
        setDraft={setDraft}
        stats={stats}
        tool={tool}
        setTool={setTool}
      />
      {tool === "volume-explorer" && <VolumeExplorer ws={ws} stats={stats} />}
      {tool === "database-explorer" && <DatabaseExplorer ws={ws} />}
      {tool && <hr />}
      {matches.length > 0 && `Items matching "${search}":`}
      <List ws={ws} items={matches.length ? matches : items} />
    </>
  );
}
