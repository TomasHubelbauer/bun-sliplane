import type { ServerWebSocket } from "bun";
import db from "./db";
import volumePath from "./volumePath.ts";
import getItems from "./getItems.ts";

export default async function deleteItem(
  ws: ServerWebSocket<unknown>,
  { rowId }: { rowId: number }
) {
  const { attachments } = db
    .query("SELECT attachments FROM items WHERE rowid = ?")
    .get(rowId) as { attachments: string };
  const files = JSON.parse(attachments || "[]").map((attachment) =>
    JSON.parse(attachment)
  );

  for (const file of files) {
    const filePath = `${volumePath}/${file.path}`;
    await Bun.file(filePath).unlink();
  }

  db.run("DELETE FROM items WHERE rowid = ?", [rowId]);
  ws.send(JSON.stringify({ type: getItems.name, data: getItems() }));
}
