import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type MouseEvent,
  type KeyboardEvent,
  useMemo,
} from "react";
import { listen, send } from "./webSocket.ts";
import formatHumanBytes from "./formatHumanBytes.ts";

type Table = {
  name: string;
  size: number;
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

export default function DatabaseExplorer() {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table>();
  const [columns, setColumns] = useState<Column[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const abortController = new AbortController();

    listen(abortController.signal, {
      getDatabaseTables: (data: Table[]) => {
        setTables(data);
        setSelectedTable(data[0]);
      },
      getDatabaseColumns: setColumns,
      getDatabaseRows: setRows,
      getDatabaseRowCount: setTotal,
    });

    send({ type: "getDatabaseTables" });
    return () => {
      abortController.abort();
    };
  }, []);

  const handleTableSelectChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const table = tables.find(
        (table) => table.name === event.currentTarget.value
      );

      setSelectedTable(table);
      setPageIndex(0);
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
      pageIndex,
      pageSize,
    });

    send({
      type: "getDatabaseRowCount",
      table: selectedTable.name,
    });
  }, [selectedTable, pageIndex, pageSize]);

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
    [selectedTable, columns, rows]
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
    [selectedTable, columns, rows]
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
    [selectedTable, rows]
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
  }, [selectedTable, selectedRows]);

  const handlePrevPageButtonClick = useCallback(() => {
    if (pageIndex <= 0) {
      return;
    }

    setPageIndex((pageIndex) => pageIndex - 1);
  }, [pageIndex]);

  const pageCount = useMemo(
    () => Math.ceil(total / pageSize),
    [total, pageSize]
  );

  const handleNextPageButtonClick = useCallback(() => {
    if (pageIndex >= pageCount - 1) {
      return;
    }

    setPageIndex((pageIndex) => pageIndex + 1);
  }, [pageIndex, pageCount]);

  const handlePageSizeSelectChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const newPageSize = +event.currentTarget.value;
      setPageSize(newPageSize);
      setPageIndex(0);
    },
    []
  );

  return (
    <div className={DatabaseExplorer.name}>
      <div className="controls">
        <select value={selectedTable?.name} onChange={handleTableSelectChange}>
          {tables.map((table) => (
            <option key={table.name} value={table.name}>
              {table.name} ({formatHumanBytes(table.size)})
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
        <select value={pageSize} onChange={handlePageSizeSelectChange}>
          <option value={1}>1 row per page</option>
          <option value={5}>5 rows per page</option>
          <option value={10}>10 rows per page</option>
          <option value={20}>20 rows per page</option>
          <option value={50}>50 rows per page</option>
          <option value={100}>100 rows per page</option>
        </select>
        Page {pageIndex + 1} of {pageCount}
        <button onClick={handlePrevPageButtonClick} disabled={pageIndex === 0}>
          Go to prev page
        </button>
        <button
          onClick={handleNextPageButtonClick}
          disabled={pageIndex >= pageCount - 1}
        >
          Go to next page
        </button>
        {total} rows total
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
