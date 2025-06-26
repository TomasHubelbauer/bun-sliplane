import type { ServerWebSocket } from "bun";
import db from "./db";
import getErrands from "./getErrands.ts";

export default async function deleteErrand(
  ws: ServerWebSocket<unknown>,
  { rowId }: { rowId: number }
) {
  db.run("DELETE FROM errands WHERE rowid = ?", [rowId]);
  ws.send(JSON.stringify({ type: getErrands.name, data: getErrands() }));
}
