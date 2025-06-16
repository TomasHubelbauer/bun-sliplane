import type { ServerWebSocket } from "bun";
import db from "./db.ts";
import getItems from "./getItems.ts";
import getDatabaseRows from "./getDatabaseRows.ts";

export default function deleteDatabaseRows(
  ws: ServerWebSocket<unknown>,
  { table, rowIds }: { table: string; rowIds: number[] }
) {
  db.run(`DELETE FROM ${table} WHERE rowid IN (${rowIds.join(",")})`);

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
