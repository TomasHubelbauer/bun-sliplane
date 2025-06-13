import type { ServerWebSocket } from "bun";
import db from "./db";
import getItems from "./getItems.ts";
import volumePath from "./volumePath.ts";

export default async function deleteAttachment(
  ws: ServerWebSocket<unknown>,
  { rowId, uuid }: { rowId: number; uuid: string }
) {
  const { attachments } = db
    .query("SELECT attachments FROM items WHERE rowid = ?")
    .get(rowId) as { attachments: string };
  const files = JSON.parse(attachments || "[]").map((attachment) =>
    JSON.parse(attachment)
  );

  const fileIndex = files.findIndex((f) => f.uuid === uuid);
  if (fileIndex === -1) {
    throw new Error("Attachment not found");
  }

  const filePath = `${volumePath}/${files[fileIndex].path}`;
  await Bun.file(filePath).unlink();

  files.splice(fileIndex, 1);
  db.run("UPDATE items SET attachments = ? WHERE rowid = ?", [
    JSON.stringify(files),
    rowId,
  ]);

  ws.send(JSON.stringify({ type: getItems.name, data: getItems() }));
}
