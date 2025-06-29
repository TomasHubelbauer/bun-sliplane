import type { ServerWebSocket } from "bun";
import db from "./db";
import getErrands from "./getErrands.ts";

export default function createReminderErrand(
  ws: ServerWebSocket<unknown>,
  { name, dayOfMonth }: { name: string; dayOfMonth: number }
) {
  db.run("INSERT INTO errands (name, type, data) VALUES (?, 'reminder', ?)", [
    name,
    JSON.stringify({ dayOfMonth }),
  ]);

  ws.send(JSON.stringify({ type: getErrands.name, data: getErrands() }));
}
