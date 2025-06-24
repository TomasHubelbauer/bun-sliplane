import {
  useCallback,
  type ChangeEvent,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import formatHumanBytes from "./formatHumanBytes.ts";
import Stamp from "./Stamp.tsx";

export type Entry = {
  name: string;
  size: number;
  atimeMs: number;
  mtimeMs: number;
  ctimeMs: number;
  birthtimeMs: number;
  isFile: boolean;
  isDirectory: boolean;
};

type FileSystemProps = {
  entries: Entry[];
  selectedEntries: string[];
  setSelectedEntries: Dispatch<SetStateAction<string[]>>;
  actions: (entry: Entry) => ReactNode;
  multiActions: (entries: Entry[]) => ReactNode;
};

export default function FileSystem({
  entries,
  selectedEntries,
  setSelectedEntries,
  actions,
  multiActions,
}: FileSystemProps) {
  const handleSelectAllInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const checked = event.currentTarget.checked;
      setSelectedEntries(checked ? entries.map((entry) => entry.name) : []);
    },
    [entries, setSelectedEntries]
  );

  const handleSelectInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const name = event.currentTarget.dataset.name;
      if (!name) {
        return;
      }

      const entry = entries.find((entry) => entry.name === name);
      if (!entry) {
        return;
      }

      const checked = event.currentTarget.checked;
      setSelectedEntries((selectedEntries) =>
        checked
          ? [...selectedEntries, name]
          : selectedEntries.filter((_name) => _name !== name)
      );
    },
    [entries, setSelectedEntries]
  );

  return (
    <table>
      {selectedEntries.length > 0 && (
        <caption>
          {`${selectedEntries.length} of ${entries.length} selected. `}
          {multiActions(
            entries.filter((entry) => selectedEntries.includes(entry.name))
          )}
        </caption>
      )}
      <thead>
        <tr>
          <th>
            <input
              type="checkbox"
              checked={entries.every((entry) =>
                selectedEntries.includes(entry.name)
              )}
              onChange={handleSelectAllInputChange}
            />
          </th>
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
        {entries.map((entry) => (
          <tr key={entry.name}>
            <td>
              <input
                type="checkbox"
                data-name={entry.name}
                checked={selectedEntries.includes(entry.name)}
                onChange={handleSelectInputChange}
              />
            </td>
            <td>
              {entry.isFile ? "📄 " : entry.isDirectory ? "📁 " : undefined}
              {entry.name}
            </td>
            <td>{formatHumanBytes(entry.size)}</td>
            <td>
              <Stamp stamp={new Date(entry.atimeMs).toISOString()} />
            </td>
            <td>
              <Stamp stamp={new Date(entry.mtimeMs).toISOString()} />
            </td>
            <td>
              <Stamp stamp={new Date(entry.ctimeMs).toISOString()} />
            </td>
            <td>
              <Stamp stamp={new Date(entry.birthtimeMs).toISOString()} />
            </td>
            <td>{actions(entry)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
