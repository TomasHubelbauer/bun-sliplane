import { ServerWebSocket } from "bun";
import db from "./db.ts";
import getDailies from "./getDailies.ts";

export default function createDaily(
  ws: ServerWebSocket<unknown>,
  { name, note, icon }: { name: string; note: string; icon: string }
) {
  db.run("INSERT INTO dailies (name, note, icon) VALUES (?, ?, ?)", [
    name,
    note,
    icon,
  ]);

  ws.send(
    JSON.stringify({
      type: getDailies.name,
      data: getDailies(),
    })
  );
}
