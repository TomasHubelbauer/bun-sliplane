import type { ServerWebSocket } from "bun";
import db from "./db.ts";
import getItems from "./getItems.ts";
import getDatabaseTables from "./getDatabaseTables.ts";
import getDatabaseColumns from "./getDatabaseColumns.ts";
import getDatabaseRows from "./getDatabaseRows.ts";

export default function updateDatabaseCell(
  ws: ServerWebSocket<unknown>,
  {
    table,
    column,
    rowId,
    value,
  }: { table: string; column: string; rowId: number; value: string }
) {
  const tables = getDatabaseTables();
  const tableExists = tables.some((t) => t.name === table);
  if (!tableExists) {
    throw new Error(`Table "${table}" does not exist`);
  }

  const columns = getDatabaseColumns(ws, { table });
  const columnExists = columns.some((c) => c.name === column);
  if (!columnExists) {
    throw new Error(`Column "${column}" does not exist in table "${table}"`);
  }

  db.run(`UPDATE ${table} SET ${column} = ? WHERE rowid = ?`, [value, rowId]);

  ws.send(
    JSON.stringify({
      type: getDatabaseRows.name,
      data: getDatabaseRows(ws, { table }),
    })
  );

  ws.send(
    JSON.stringify({
      type: getItems.name,
      data: getItems(),
    })
  );
}
