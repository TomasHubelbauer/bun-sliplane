import { type ReactNode } from "react";
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
  actions: (entry: Entry) => ReactNode;
};

export default function FileSystem({ entries, actions }: FileSystemProps) {
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
        {entries.map((entry) => (
          <tr key={entry.name}>
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
