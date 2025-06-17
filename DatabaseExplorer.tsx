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
  const [selectedTable, setSelectedTable] = useState<Table>();
  const [columns, setColumns] = useState<Column[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  useEffect(() => {
    const abortController = new AbortController();

    listen(abortController.signal, {
      getDatabaseTables: (data: Table[]) => {
        setTables(data);
        setSelectedTable(data[0]);
      },
      getDatabaseColumns: setColumns,
      getDatabaseRows: setRows,
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

      setSelectedTable(table);
    },
    [tables]
  );

  useEffect(() => {
    if (!selectedTable) {
      return;
    }

    send({
      type: "getDatabaseColumns",
      table: selectedTable.name,
    });

    send({
      type: "getDatabaseRows",
      table: selectedTable.name,
    });
  }, [send, selectedTable]);

  const handleTextAreaKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (!selectedTable) {
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
        table: selectedTable.name,
        column: column.name,
        rowId,
        value,
      });
    },
    [send, selectedTable, columns, rows]
  );

  const handleCodeClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (!selectedTable) {
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
        `${selectedTable.name}.${column.name} #${row.rowid}:`,
        String(row[column.name])
      );

      if (value === null) {
        return;
      }

      send({
        type: "updateDatabaseCell",
        table: selectedTable.name,
        column: column.name,
        rowId,
        value,
      });
    },
    [send, selectedTable, columns, rows]
  );

  const handleDeleteButtonClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (!selectedTable) {
        return;
      }

      const rowId = +event.currentTarget.dataset.rowid!;
      const row = rows.find((row) => row.rowid === rowId);
      if (!row) {
        return;
      }

      if (
        !confirm(
          `Are you sure you want to delete row #${row.rowid} in ${selectedTable.name}?`
        )
      ) {
        return;
      }

      send({
        type: "deleteDatabaseRow",
        table: selectedTable.name,
        rowId,
      });
    },
    [send, selectedTable, rows]
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

  const handleSelectInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!selectedTable) {
        return;
      }

      const rowId = +event.currentTarget.dataset.rowid!;
      const row = rows.find((row) => row.rowid === rowId);
      if (!row) {
        return;
      }

      const checked = event.currentTarget.checked;
      setSelectedRows((selectedRows) =>
        checked
          ? [...selectedRows, rowId]
          : selectedRows.filter((id) => id !== rowId)
      );
    },
    [selectedTable, rows]
  );

  const handleDeleteSelectedButtonClick = useCallback(() => {
    if (!selectedTable || selectedRows.length === 0) {
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${selectedRows.length} selected rows in ${selectedTable.name}?`
      )
    ) {
      return;
    }

    send({
      type: "deleteDatabaseRows",
      table: selectedTable.name,
      rowIds: selectedRows,
    });

    setSelectedRows([]);
  }, [send, selectedTable, selectedRows]);

  return (
    <div className={DatabaseExplorer.name}>
      <div className="controls">
        <select value={selectedTable?.name} onChange={handleTableSelectChange}>
          {tables.map((table) => (
            <option key={table.name} value={table.name}>
              {table.name}
            </option>
          ))}
        </select>
        {selectedTable && (
          <button
            data-table={selectedTable?.name}
            onClick={handleDeleteTableButtonClick}
          >
            Delete table
          </button>
        )}
        {selectedRows.length > 0 && (
          <button onClick={handleDeleteSelectedButtonClick}>
            Delete {selectedRows.length} selected
          </button>
        )}
      </div>
      <table>
        <thead>
          <tr>
            <th />
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
              <td>
                <input
                  type="checkbox"
                  data-rowid={row.rowid}
                  checked={selectedRows.includes(row.rowid)}
                  onChange={handleSelectInputChange}
                />
              </td>
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
