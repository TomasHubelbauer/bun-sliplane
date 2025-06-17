import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [ws, setWs] = useState(new WebSocket("/ws"));

  const [draft, setDraft] = useState("");
  const [items, setItems] = useState<ItemType[]>([]);
  const [tool, setTool] = useState<Tool | undefined>();
  const [stats, setStats] = useState<Stats | undefined>();
  const [readState, setReadState] = useState(ws.readyState);
  const sendQueue = useRef<unknown[]>([]);

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

    ws.addEventListener(
      "error",
      () => {
        setReadState(ws.readyState);
        setWs(new WebSocket("/ws"));
      },
      {
        signal: abortController.signal,
      }
    );

    ws.addEventListener(
      "close",
      () => {
        setReadState(ws.readyState);
        setWs(new WebSocket("/ws"));
      },
      {
        signal: abortController.signal,
      }
    );

    ws.addEventListener(
      "open",
      () => {
        ws.send(JSON.stringify({ type: "getItems" }));
        ws.send(JSON.stringify({ type: "getStats" }));
        ws.send(JSON.stringify({ type: "getAudits" }));
        for (const data of sendQueue.current) {
          ws.send(JSON.stringify(data));
        }

        setReadState(ws.readyState);
      },
      {
        signal: abortController.signal,
      }
    );

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
      () => {
        if (ws.readyState !== WebSocket.OPEN) {
          setWs(new WebSocket("/ws"));
        } else {
          ws.send(JSON.stringify({ type: "getItems" }));
        }
      },
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

  const send = useCallback(
    (data: { type: string } & object) => {
      if (ws.readyState !== WebSocket.OPEN) {
        sendQueue.current.push(data);
        return;
      }

      ws.send(JSON.stringify(data));
    },
    [ws]
  );

  // TODO: Change the `any` to `unknown` or make the method generic
  const listen = useCallback(
    (
      abortSignal: AbortSignal,
      handlers: { [type: string]: (data: unknown) => void }
    ) => {
      ws.addEventListener(
        "message",
        (event) => {
          const { type, data } = JSON.parse(event.data);
          const handler = handlers[type];
          if (handler) {
            handler(data);
          }
        },
        { signal: abortSignal }
      );
    },
    [ws]
  );

  return (
    <>
      <Header
        send={send}
        listen={listen}
        draft={draft}
        setDraft={setDraft}
        stats={stats}
        tool={tool}
        setTool={setTool}
        readyState={readState}
      />
      {tool === "volume-explorer" && (
        <VolumeExplorer send={send} listen={listen} stats={stats} />
      )}
      {tool === "machine-explorer" && (
        <MachineExplorer send={send} listen={listen} />
      )}
      {tool === "database-explorer" && (
        <DatabaseExplorer send={send} listen={listen} />
      )}
      {tool == "link-watcher" && <LinkWatcher send={send} listen={listen} />}
      {tool && <hr />}
      {matches.length > 0 && `Items matching "${search}":`}
      <List
        send={send}
        listen={listen}
        items={matches.length ? matches : items}
      />
    </>
  );
}
