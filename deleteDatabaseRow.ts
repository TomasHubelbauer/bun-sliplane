import type { ServerWebSocket } from "bun";
import db from "./db.ts";
import getItems from "./getItems.ts";
import getDatabaseRows from "./getDatabaseRows.ts";

export default function deleteDatabaseRow(
  ws: ServerWebSocket<unknown>,
  { table, rowId }: { table: string; rowId: number }
) {
  db.run(`DELETE FROM ${table} WHERE rowid = ?`, [rowId]);

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
