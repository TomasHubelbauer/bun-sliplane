import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from "react";
import Usage from "./Usage.tsx";
import type { Stats } from "./Stats.ts";
import FileSystem, { type Entry } from "./FileSystem.tsx";

type VolumeExplorerProps = {
  ws: WebSocket;
  stats: Stats | undefined;
};

export default function VolumeExplorer({ ws, stats }: VolumeExplorerProps) {
  const [items, setItems] = useState<Entry[]>([]);

  useEffect(() => {
    const abortController = new AbortController();
    ws.addEventListener(
      "message",
      (event) => {
        const { type, data } = JSON.parse(event.data);
        if (type === "getVolumeFiles") {
          setItems(data);
        }
      },
      { signal: abortController.signal }
    );

    ws.send(JSON.stringify({ type: "getVolumeFiles" }));
    return () => {
      abortController.abort();
    };
  }, [ws]);

  const handleDeleteButtonClick = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      const name = event.currentTarget.dataset.name;
      if (!confirm(`Are you sure you want to delete "${name}"?`)) {
        return;
      }

      ws.send(
        JSON.stringify({
          type: "deleteVolumeFile",
          name,
        })
      );
    },
    [ws]
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
