import type { ServerWebSocket } from "bun";
import db from "./db.ts";
import getDatabaseTables from "./getDatabaseTables.ts";

export default function deleteDatabaseTable(
  ws: ServerWebSocket<unknown>,
  { table }: { table: string }
) {
  db.run(`DROP TABLE IF EXISTS ${table}`, []);

  ws.send(
    JSON.stringify({
      type: getDatabaseTables.name,
      data: getDatabaseTables(),
    })
  );
}
