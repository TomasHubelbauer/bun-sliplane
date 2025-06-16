import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type MouseEvent,
  type KeyboardEvent,
} from "react";
import type { WebSocketProps } from "./WebSocketProps.ts";

type DatabaseExplorerProps = WebSocketProps;

type Table = {
  name: string;
};

type Column = {
  cid: number;
  name: string;
  type: string;
  pk: 0 | 1;
  notnull: 0 | 1;
};

type Row = {
  rowid: number;
  [key: string]: string | number | null;
};

export default function DatabaseExplorer({
  send,
  listen,
}: DatabaseExplorerProps) {
  const [tables, setTables] = useState<Table[]>([]);
  const [table, setTable] = useState<Table>();
  const [columns, setColumns] = useState<Column[]>([]);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const abortController = new AbortController();

    listen(abortController.signal, {
      getDatabaseTables: (data: Table[]) => {
        setTables(data);
        setTable(data[0]);
      },
      getDatabaseColumns: (data: Column[]) => {
        setColumns(data);
      },
      getDatabaseRows: (data: Row[]) => {
        setRows(data);
      },
    });

    send({ type: "getDatabaseTables" });
    return () => {
      abortController.abort();
    };
  }, [send, listen]);

  const handleTableSelectChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const table = tables.find(
        (table) => table.name === event.currentTarget.value
      );

      setTable(table);
    },
    [tables]
  );

  useEffect(() => {
    if (!table) {
      return;
    }

    send({
      type: "getDatabaseColumns",
      table: table.name,
    });

    send({
      type: "getDatabaseRows",
      table: table.name,
    });
  }, [send, table]);

  const handleTextAreaKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (!table) {
        return;
      }

      const rowId = +event.currentTarget.dataset.rowid!;
      const row = rows.find((row) => row.rowid === rowId);
      if (!row) {
        return;
      }

      const cid = +event.currentTarget.dataset.cid!;
      const column = columns.find((column) => column.cid === cid);
      if (!column) {
        return;
      }

      if (event.key !== "Enter" || !event.shiftKey) {
        return;
      }

      event.preventDefault();
      const value = event.currentTarget.value;

      send({
        type: "updateDatabaseCell",
        table: table.name,
        column: column.name,
        rowId,
        value,
      });
    },
    [send, table, columns, rows]
  );

  const handleCodeClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (!table) {
        return;
      }

      const rowId = +event.currentTarget.dataset.rowid!;
      const row = rows.find((row) => row.rowid === rowId);
      if (!row) {
        return;
      }

      const cid = +event.currentTarget.dataset.cid!;
      const column = columns.find((column) => column.cid === cid);
      if (!column) {
        return;
      }

      const value = prompt(
        `${table.name}.${column.name} #${row.rowid}:`,
        String(row[column.name])
      );

      if (value === null) {
        return;
      }

      send({
        type: "updateDatabaseCell",
        table: table.name,
        column: column.name,
        rowId,
        value,
      });
    },
    [send, table, columns, rows]
  );

  const handleDeleteButtonClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (!table) {
        return;
      }

      const rowId = +event.currentTarget.dataset.rowid!;
      const row = rows.find((row) => row.rowid === rowId);
      if (!row) {
        return;
      }

      if (
        !confirm(
          `Are you sure you want to delete row #${row.rowid} in ${table.name}?`
        )
      ) {
        return;
      }

      send({
        type: "deleteDatabaseRow",
        table: table.name,
        rowId,
      });
    },
    [send, table, rows]
  );

  const handleDeleteTableButtonClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const table = event.currentTarget.dataset.table;
      if (
        !table ||
        !confirm(`Are you sure you want to delete table "${table}"?`)
      ) {
        return;
      }

      send({
        type: "deleteDatabaseTable",
        table,
      });
    },
    [send]
  );

  return (
    <div className={DatabaseExplorer.name}>
      <select value={table?.name} onChange={handleTableSelectChange}>
        {tables.map((table) => (
          <option key={table.name} value={table.name}>
            {table.name}
          </option>
        ))}
      </select>
      {table && (
        <button data-table={table?.name} onClick={handleDeleteTableButtonClick}>
          Delete
        </button>
      )}
      <table>
        <thead>
          <tr>
            <th>Row ID</th>
            {columns.map((column) => (
              <th key={column.name}>
                <code>{column.name}</code>
              </th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.rowid}>
              <td>{row.rowid}</td>
              {columns.map((column) => (
                <td key={column.name}>
                  {row[column.name]?.toString().includes("\n") ? (
                    <textarea
                      defaultValue={row[column.name]?.toString()}
                      key={column.name}
                      data-rowid={row.rowid}
                      data-cid={column.cid}
                      onKeyDown={handleTextAreaKeyDown}
                      rows={5}
                    />
                  ) : (
                    <code
                      data-rowid={row.rowid}
                      data-cid={column.cid}
                      onClick={handleCodeClick}
                      title={String(row[column.name])}
                    >
                      {row[column.name]}
                    </code>
                  )}
                </td>
              ))}
              <td>
                <button
                  data-rowid={row.rowid}
                  onClick={handleDeleteButtonClick}
                >
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
