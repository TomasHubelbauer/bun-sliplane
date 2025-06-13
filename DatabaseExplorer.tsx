import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type MouseEvent,
  type KeyboardEvent,
} from "react";

type DatabaseExplorerProps = {
  ws: WebSocket;
};

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

export default function DatabaseExplorer({ ws }: DatabaseExplorerProps) {
  const [tables, setTables] = useState<Table[]>([]);
  const [table, setTable] = useState<Table>();
  const [columns, setColumns] = useState<Column[]>([]);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const abortController = new AbortController();
    ws.addEventListener(
      "message",
      (event) => {
        const { type, data } = JSON.parse(event.data);
        switch (type) {
          case "getDatabaseTables": {
            setTables(data);
            setTable(data[0]);
            break;
          }
          case "getDatabaseColumns": {
            setColumns(data);
            break;
          }
          case "getDatabaseRows": {
            setRows(data);
            break;
          }
        }
      },
      { signal: abortController.signal }
    );

    ws.send(JSON.stringify({ type: "getDatabaseTables" }));
    return () => {
      abortController.abort();
    };
  }, [ws]);

  const handleTableSelectChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const table = tables.find(
        (table) => table.name === event.currentTarget.value
      );

      setTable(table);
    },
    [ws, tables]
  );

  useEffect(() => {
    if (!table) {
      return;
    }

    ws.send(
      JSON.stringify({
        type: "getDatabaseColumns",
        table: table.name,
      })
    );

    ws.send(
      JSON.stringify({
        type: "getDatabaseRows",
        table: table.name,
      })
    );
  }, [ws, table]);

  const handleTextAreaKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
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

      ws.send(
        JSON.stringify({
          type: "updateDatabaseCell",
          table: table?.name,
          column: column.name,
          rowId,
          value,
        })
      );
    },
    [ws, table, columns, rows]
  );

  const handleCodeClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
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
        `${table?.name}.${column.name} #${row.rowid}:`,
        String(row[column.name])
      );

      if (value === null) {
        return;
      }

      ws.send(
        JSON.stringify({
          type: "updateDatabaseCell",
          table: table?.name,
          column: column.name,
          rowId,
          value,
        })
      );
    },
    [ws, table, columns, rows]
  );

  const handleDeleteButtonClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const rowId = +event.currentTarget.dataset.rowid!;
      const row = rows.find((row) => row.rowid === rowId);
      if (!row) {
        return;
      }

      if (
        !confirm(
          `Are you sure you want to delete row #${row.rowid} in ${table?.name}?`
        )
      ) {
        return;
      }

      ws.send(
        JSON.stringify({
          type: "deleteDatabaseRow",
          table: table?.name,
          rowId,
        })
      );
    },
    [ws, table, rows]
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
