import type { ServerWebSocket } from "bun";
import db from "./db.ts";
import listLinks from "./listLinks.ts";

export default function setLinkRunMaskNegative(
  ws: ServerWebSocket<unknown>,
  data: { rowId: number; runMaskNegative: string }
) {
  db.run("UPDATE links SET runMaskNegative = ? WHERE rowid = ?", [
    data.runMaskNegative,
    data.rowId,
  ]);

  ws.send(JSON.stringify({ type: listLinks.name, data: listLinks() }));
}
