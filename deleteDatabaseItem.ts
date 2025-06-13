import type { ServerWebSocket } from "bun";
import db from "./db";
import getDatabaseItems from "./getDatabaseItems.ts";
import getItems from "./getItems.ts";

export default function deleteDatabaseItem(
  ws: ServerWebSocket<unknown>,
  { rowId }: { rowId: number }
) {
  db.run("DELETE FROM items WHERE rowid = ?", [rowId]);

  ws.send(
    JSON.stringify({
      type: getDatabaseItems.name,
      data: getDatabaseItems(),
    })
  );

  ws.send(
    JSON.stringify({
      type: getItems.name,
      data: getItems(),
    })
  );
}
