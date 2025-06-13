import type { ServerWebSocket } from "bun";
import db from "./db";
import getItems from "./getItems.ts";

export default function createItem(
  ws: ServerWebSocket<unknown>,
  { name, text }: { name: string; text: string }
) {
  db.run("INSERT INTO items (stamp, name, text) VALUES (?, ?, ?)", [
    new Date().toISOString(),
    name,
    text,
  ]);

  ws.send(JSON.stringify({ type: getItems.name, data: getItems() }));
}
