import { ServerWebSocket } from "bun";
import db from "./db.ts";
import getDailies from "./getDailies.ts";

export default function setDailyStamp(
  ws: ServerWebSocket<unknown>,
  { rowId }: { rowId: number }
) {
  const daily = db.query("SELECT * FROM dailies WHERE rowid = ?").get(rowId);
  if (!daily) {
    return;
  }

  db.exec("UPDATE dailies SET stamp = ? WHERE rowid = ?", [
    new Date().toISOString(),
    rowId,
  ]);

  ws.send(
    JSON.stringify({
      type: getDailies.name,
      data: getDailies(),
    })
  );
}
