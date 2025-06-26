import type { ServerWebSocket } from "bun";
import db from "./db";
import getErrands from "./getErrands.ts";

export default function createTaskErrand(
  ws: ServerWebSocket<unknown>,
  { name }: { name: string }
) {
  db.run("INSERT INTO errands (name, type) VALUES (?, 'task')", [name]);

  ws.send(JSON.stringify({ type: getErrands.name, data: getErrands() }));
}
