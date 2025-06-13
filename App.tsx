import { useEffect, useMemo, useState } from "react";
import type { Item as ItemType } from "./ItemType.ts";
import Composer from "./Composer.tsx";
import List from "./List.tsx";
import Tools from "./Tools.tsx";

export default function App() {
  const [draft, setDraft] = useState<string>("");
  const [items, setItems] = useState<ItemType[]>([]);

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
      <Composer ws={ws} draft={draft} setDraft={setDraft} />
      <Tools ws={ws} />
      {matches.length > 0 && `Items matching "${search}":`}
      <List ws={ws} items={matches.length ? matches : items} />
    </>
  );
}
