import { useCallback, useEffect, useState, type MouseEvent } from "react";
import Usage from "./Usage.tsx";
import type { Stats } from "./Stats.ts";
import FileSystem, { type Entry } from "./FileSystem.tsx";
import type { WebSocketProps } from "./WebSocketProps.ts";

type VolumeExplorerProps = WebSocketProps & {
  stats: Stats | undefined;
};

export default function VolumeExplorer({
  send,
  listen,
  stats,
}: VolumeExplorerProps) {
  const [items, setItems] = useState<Entry[]>([]);

  useEffect(() => {
    const abortController = new AbortController();

    listen(abortController.signal, {
      getVolumeFiles: (data: Entry[]) => {
        setItems(data);
      },
    });

    send({ type: "getVolumeFiles" });
    return () => {
      abortController.abort();
    };
  }, [send, listen]);

  const handleDeleteButtonClick = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      const name = event.currentTarget.dataset.name;
      if (!name) {
        return;
      }

      if (!confirm(`Are you sure you want to delete "${name}"?`)) {
        return;
      }

      send({
        type: "deleteVolumeFile",
        name,
      });
    },
    [send]
  );

  const actions = useCallback(
    (entry: Entry) => (
      <button
        key={entry.name}
        data-name={entry.name}
        onClick={handleDeleteButtonClick}
      >
        Delete
      </button>
    ),
    [handleDeleteButtonClick]
  );

  return (
    <div className={VolumeExplorer.name}>
      {stats && <Usage {...stats} />}
      <FileSystem entries={items} actions={actions} />
    </div>
  );
}
