import { useCallback, useEffect, useState } from "react";
import FileSystem, { type Entry } from "./FileSystem.tsx";
import type { WebSocketProps } from "./WebSocketProps.ts";

type MachineExplorerProps = WebSocketProps;

export default function MachineExplorer({
  send,
  listen,
}: MachineExplorerProps) {
  const [items, setItems] = useState<Entry[]>([]);

  useEffect(() => {
    const abortController = new AbortController();

    listen(abortController.signal, {
      getMachineFiles: (data: Entry[]) => {
        setItems(data);
      },
    });

    send({ type: "getMachineFiles" });
    return () => {
      abortController.abort();
    };
  }, [send, listen]);

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
