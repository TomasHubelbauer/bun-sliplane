import type { ServerWebSocket } from "bun";
import db from "./db";
import getDatabaseItems from "./getDatabaseItems.ts";
import getItems from "./getItems.ts";

export default function updateDatabaseItem(
  ws: ServerWebSocket<unknown>,
  { rowId, key, value }: { rowId: number; key: string; value: string }
) {
  if (!rowId || !key || !value) {
    throw new Error("Missing required parameters");
  }

  if (
    key !== "stamp" &&
    key !== "name" &&
    key !== "text" &&
    key !== "attachments"
  ) {
    throw new Error("Invalid key");
  }

  db.run(`UPDATE items SET ${key} = ? WHERE rowid = ?`, [value, rowId]);

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
