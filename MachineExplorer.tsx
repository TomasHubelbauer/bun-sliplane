import { useCallback, useEffect, useState } from "react";
import FileSystem, { type Entry } from "./FileSystem.tsx";

type MachineExplorerProps = {
  ws: WebSocket;
};

export default function MachineExplorer({ ws }: MachineExplorerProps) {
  const [items, setItems] = useState<Entry[]>([]);

  useEffect(() => {
    const abortController = new AbortController();
    ws.addEventListener(
      "message",
      (event) => {
        const { type, data } = JSON.parse(event.data);
        if (type === "getMachineFiles") {
          setItems(data);
        }
      },
      { signal: abortController.signal }
    );

    ws.send(JSON.stringify({ type: "getMachineFiles" }));
    return () => {
      abortController.abort();
    };
  }, [ws]);

  const actions = useCallback(
    (entry: Entry) => (
      <a key={entry.name} href={`/download/${entry.name}`} target="_blank">
        Download
      </a>
    ),
    []
  );

  return (
    <div className={MachineExplorer.name}>
      <FileSystem entries={items} actions={actions} />
    </div>
  );
}
