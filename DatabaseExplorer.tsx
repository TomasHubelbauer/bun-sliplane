import {
  useCallback,
  useEffect,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import type { Item } from "./ItemType.ts";

type DatabaseExplorerProps = {
  ws: WebSocket;
};

export default function DatabaseExplorer({ ws }: DatabaseExplorerProps) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const abortController = new AbortController();
    ws.addEventListener(
      "message",
      (event) => {
        const { type, data } = JSON.parse(event.data);
        if (type === "getDatabaseItems") {
          setItems(data);
        }
      },
      { signal: abortController.signal }
    );

    ws.send(JSON.stringify({ type: "getDatabaseItems" }));
    return () => {
      abortController.abort();
    };
  }, [ws]);

  const handleTdClick = useCallback(
    (event: MouseEvent<HTMLTableCellElement>) => {
      if (
        !event.currentTarget.dataset.rowid ||
        !event.currentTarget.dataset.key
      ) {
        return;
      }

      const rowId = +event.currentTarget.dataset.rowid;
      const key = event.currentTarget.dataset.key;
      const item = items.find((item) => item.rowid === rowId);
      if (!item) {
        return;
      }

      const value = prompt(`Edit ${key}`, item[key]);
      if (value === null || value === item[key]) {
        return;
      }

      ws.send(
        JSON.stringify({
          type: "updateDatabaseItem",
          rowId,
          key,
          value,
        })
      );
    },
    [ws, items]
  );

  const handleTextAreaKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== "Enter" || !event.shiftKey) {
        return;
      }

      if (
        !event.currentTarget.dataset.rowid ||
        !event.currentTarget.dataset.key
      ) {
        return;
      }

      const rowId = +event.currentTarget.dataset.rowid;
      const key = event.currentTarget.dataset.key;
      const item = items.find((item) => item.rowid === rowId);
      if (!item) {
        return;
      }

      ws.send(
        JSON.stringify({
          type: "updateDatabaseItem",
          rowId,
          key,
          value: event.currentTarget.value.trim(),
        })
      );
    },
    [ws, items]
  );

  const handleDeleteButtonClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const rowId = +event.currentTarget.dataset.rowid!;
      const item = items.find((item) => item.rowid === rowId)!;
      if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
        return;
      }

      ws.send(
        JSON.stringify({
          type: "deleteDatabaseItem",
          rowId,
        })
      );
    },
    [ws, items]
  );

  return (
    <table className={DatabaseExplorer.name}>
      <thead>
        <tr>
          <th>RowID</th>
          <th>Stamp</th>
          <th>Name</th>
          <th>Text</th>
          <th>Attachments</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.rowid}>
            <td>{item.rowid}</td>
            <td
              data-key="stamp"
              data-rowid={item.rowid}
              onClick={handleTdClick}
            >
              {item.stamp}
            </td>
            <td data-key="name">
              <textarea
                data-rowid={item.rowid}
                data-key="name"
                onKeyDown={handleTextAreaKeyDown}
                defaultValue={item.name}
              />
            </td>
            <td data-key="text">
              <textarea
                data-rowid={item.rowid}
                data-key="text"
                onKeyDown={handleTextAreaKeyDown}
                defaultValue={item.text}
              />
            </td>
            <td data-key="attachments">
              <textarea
                data-rowid={item.rowid}
                data-key="attachments"
                onKeyDown={handleTextAreaKeyDown}
                defaultValue={item.attachments}
              />
            </td>
            <td>
              <button data-rowid={item.rowid} onClick={handleDeleteButtonClick}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
