import type { ServerWebSocket } from "bun";
import db from "./db.ts";

export default function fetchLinkDetail(
  ws: ServerWebSocket<unknown>,
  { rowId }: { rowId: number }
) {
  return db.query("SELECT * FROM links WHERE rowid = ?").get(rowId);
}
