import { useCallback, useEffect, useState, type MouseEvent } from "react";
import formatHumanBytes from "./formatHumanBytes.ts";
import Stamp from "./Stamp.tsx";
import Usage from "./Usage.tsx";

type VolumeExplorerProps = {
  ws: WebSocket;
  stats:
    | {
        bsize: number;
        bfree: number;
        blocks: number;
      }
    | undefined;
};

type Item = {
  name: string;
  size: number;
  atimeMs: number;
  mtimeMs: number;
  ctimeMs: number;
  birthtimeMs: number;
};

export default function VolumeExplorer({ ws, stats }: VolumeExplorerProps) {
  const [items, setItems] = useState<Item[]>([]);

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

  return (
    <div className={VolumeExplorer.name}>
      {stats && <Usage stats={stats} />}
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
    </div>
  );
}
