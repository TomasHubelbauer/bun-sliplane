import { useCallback, useEffect, useState, type MouseEvent } from "react";
import Usage from "./Usage.tsx";
import type { Stats } from "./Stats.ts";
import FileSystem, { type Entry } from "./FileSystem.tsx";
import { listen, send } from "./webSocket.ts";

type VolumeExplorerProps = {
  stats: Stats | undefined;
};

export default function VolumeExplorer({ stats }: VolumeExplorerProps) {
  const [items, setItems] = useState<Entry[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  useEffect(() => {
    const abortController = new AbortController();

    listen(abortController.signal, {
      getVolumeFiles: setItems,
    });

    send({ type: "getVolumeFiles" });
    return () => {
      abortController.abort();
    };
  }, []);

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

  const handleDeleteMultipleButtonClick = useCallback(async () => {
    if (
      !confirm(`Are you sure you want to delete ${selectedItems.length} items?`)
    ) {
      return;
    }

    send({
      type: "deleteVolumeFiles",
      names: selectedItems,
    });

    setSelectedItems([]);
  }, [selectedItems, send]);

  const multiActions = useCallback(
    () => <button onClick={handleDeleteMultipleButtonClick}>Delete</button>,
    [handleDeleteMultipleButtonClick]
  );

  return (
    <div className={VolumeExplorer.name}>
      {stats && <Usage {...stats} />}
      <FileSystem
        entries={items}
        selectedEntries={selectedItems}
        setSelectedEntries={setSelectedItems}
        actions={actions}
        multiActions={multiActions}
      />
    </div>
  );
}
