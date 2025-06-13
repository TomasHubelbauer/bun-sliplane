import type { ServerWebSocket } from "bun";
import db from "./db";
import getItems from "./getItems.ts";

export default function updateItem(
  ws: ServerWebSocket<unknown>,
  data: { rowId: number; name: string; text: string }
) {
  if ("name" in data) {
    db.run("UPDATE items SET name = ? WHERE rowid = ?", [
      data.name,
      data.rowId,
    ]);
  }

  if ("text" in data) {
    db.run("UPDATE items SET text = ? WHERE rowid = ?", [
      data.text,
      data.rowId,
    ]);
  }

  ws.send(JSON.stringify({ type: getItems.name, data: getItems() }));
}
