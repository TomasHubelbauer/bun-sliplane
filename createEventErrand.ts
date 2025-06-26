import type { ServerWebSocket } from "bun";
import db from "./db";
import getErrands from "./getErrands.ts";

export default function createEventErrand(
  ws: ServerWebSocket<unknown>,
  { name, stamp }: { name: string; stamp: string }
) {
  db.run("INSERT INTO errands (name, type, data) VALUES (?, 'event', ?)", [
    name,
    JSON.stringify({ stamp }),
  ]);

  ws.send(JSON.stringify({ type: getErrands.name, data: getErrands() }));
}
