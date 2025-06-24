import {
  Fragment,
  useCallback,
  useEffect,
  useState,
  type MouseEvent,
} from "react";
import FileSystem, { type Entry } from "./FileSystem.tsx";
import { listen, send } from "./webSocket.ts";

export default function MachineExplorer() {
  const [items, setItems] = useState<Entry[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

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
        type: "deleteMachineFile",
        name,
      });
    },
    [send]
  );

  const actions = useCallback(
    (entry: Entry) => (
      <Fragment key={entry.name}>
        <a key={entry.name} href={`/download/${entry.name}`} target="_blank">
          Download
        </a>
        <button
          key={entry.name}
          data-name={entry.name}
          onClick={handleDeleteButtonClick}
        >
          Delete
        </button>
      </Fragment>
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
      type: "deleteMachineFiles",
      names: selectedItems,
    });
  }, [selectedItems, send]);

  const multiActions = useCallback(
    () => <button onClick={handleDeleteMultipleButtonClick}>Delete</button>,
    [handleDeleteMultipleButtonClick]
  );

  return (
    <div className={MachineExplorer.name}>
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
