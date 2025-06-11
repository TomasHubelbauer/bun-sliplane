import { useCallback, useEffect, useState, type MouseEvent } from "react";
import formatHumanBytes from "./formatHumanBytes.ts";
import Stamp from "./Stamp.tsx";

type VolumeExplorerProps = {
  password: string;
};

type Item = {
  name: string;
  size: number;
  atimeMs: number;
  mtimeMs: number;
  ctimeMs: number;
  birthtimeMs: number;
};

export default function VolumeExplorer({ password }: VolumeExplorerProps) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    void (async function () {
      const response = await fetch(`/${password}/volume`);
      setItems(await response.json());
    })();
  }, []);

  const handleDeleteButtonClick = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      const name = event.currentTarget.dataset.name;
      if (!confirm(`Are you sure you want to delete "${name}"?`)) {
        return;
      }

      await fetch(`/${password}/volume?name=${name}`, {
        method: "DELETE",
      });

      const response = await fetch(`/${password}/volume`);
      setItems(await response.json());
    },
    [password]
  );

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Size (bytes)</th>
          <th>Access Time</th>
          <th>Modification Time</th>
          <th>Change Time</th>
          <th>Creation Time</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.name}>
            <td>{item.name}</td>
            <td>{formatHumanBytes(item.size)}</td>
            <td>
              <Stamp stamp={new Date(item.atimeMs).toISOString()} />
            </td>
            <td>
              <Stamp stamp={new Date(item.mtimeMs).toISOString()} />
            </td>
            <td>
              <Stamp stamp={new Date(item.ctimeMs).toISOString()} />
            </td>
            <td>
              <Stamp stamp={new Date(item.birthtimeMs).toISOString()} />
            </td>
            <td>
              <button data-name={item.name} onClick={handleDeleteButtonClick}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
