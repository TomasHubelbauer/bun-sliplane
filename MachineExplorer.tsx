import { useCallback, useEffect, useState } from "react";
import FileSystem, { type Entry } from "./FileSystem.tsx";
import { listen, send } from "./webSocket.ts";

export default function MachineExplorer() {
  const [items, setItems] = useState<Entry[]>([]);

  useEffect(() => {
    const abortController = new AbortController();

    listen(abortController.signal, {
      getMachineFiles: setItems,
    });

    send({ type: "getMachineFiles" });
    return () => {
      abortController.abort();
    };
  }, []);

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
