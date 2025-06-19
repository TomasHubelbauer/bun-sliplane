import type { ServerWebSocket } from "bun";
import db from "./db.ts";
import getItems from "./getItems.ts";
import getDatabaseRows from "./getDatabaseRows.ts";

export default function deleteDatabaseRows(
  ws: ServerWebSocket<unknown>,
  {
    table,
    rowIds,
    pageIndex,
    pageSize,
  }: { table: string; rowIds: number[]; pageIndex: number; pageSize: number }
) {
  db.run(`DELETE FROM ${table} WHERE rowid IN (${rowIds.join(",")})`);

  ws.send(
    JSON.stringify({
      type: getDatabaseRows.name,
      data: getDatabaseRows(ws, { table, pageIndex, pageSize }),
    })
  );

  ws.send(
    JSON.stringify({
      type: getItems.name,
      data: getItems(),
    })
  );
}
