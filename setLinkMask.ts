import type { ServerWebSocket } from "bun";
import db from "./db";
import listLinks from "./listLinks.ts";

export default function setLinkMask(
  ws: ServerWebSocket<unknown>,
  data: { rowId: number; mask: string }
) {
  db.run("UPDATE links SET mask = ? WHERE rowid = ?", [data.mask, data.rowId]);

  ws.send(JSON.stringify({ type: listLinks.name, data: listLinks() }));
}
