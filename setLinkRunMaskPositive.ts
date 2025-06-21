import type { ServerWebSocket } from "bun";
import db from "./db.ts";
import listLinks from "./listLinks.ts";

export default function setLinkRunMaskPositive(
  ws: ServerWebSocket<unknown>,
  data: { rowId: number; runMaskPositive: string }
) {
  db.run("UPDATE links SET runMaskPositive = ? WHERE rowid = ?", [
    data.runMaskPositive,
    data.rowId,
  ]);

  ws.send(JSON.stringify({ type: listLinks.name, data: listLinks() }));
}
