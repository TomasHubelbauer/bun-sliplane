import { useCallback, useEffect, useState, type MouseEvent } from "react";
import type { Item } from "./ItemType.ts";

type DatabaseExplorerProps = {
  password: string;
};

export default function DatabaseExplorer({ password }: DatabaseExplorerProps) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    void (async function () {
      const response = await fetch(`/${password}/database`);
      setItems(await response.json());
    })();
  }, []);

  const handleTdClick = useCallback(
    async (event: MouseEvent<HTMLTableCellElement>) => {
      const rowId = +event.currentTarget.dataset.rowid!;
      const key = event.currentTarget.dataset.key!;
      const item = items.find((item) => item.rowid === rowId)!;
      const value = prompt(`Edit ${key}`, item[key]);
      if (value === null || value === item[key]) {
        return;
      }

      await fetch(`/${password}/database?rowId=${rowId}&key=${key}`, {
        method: "PUT",
        body: value,
      });

      setItems(await (await fetch(`/${password}/database`)).json());
    },
    [items, password]
  );

  const handleDeleteButtonClick = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      const rowId = +event.currentTarget.dataset.rowid!;
      const item = items.find((item) => item.rowid === rowId)!;
      if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
        return;
      }

      await fetch(`/${password}/database?rowId=${rowId}`, {
        method: "DELETE",
      });

      setItems(await (await fetch(`/${password}/database`)).json());
    },
    [items, password]
  );

  return (
    <table>
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
            <td data-key="name" data-rowid={item.rowid} onClick={handleTdClick}>
              {item.name}
            </td>
            <td data-key="text" data-rowid={item.rowid} onClick={handleTdClick}>
              {item.text}
            </td>
            <td
              data-key="attachments"
              data-rowid={item.rowid}
              onClick={handleTdClick}
            >
              {item.attachments}
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
