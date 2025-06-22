import { type ServerWebSocket } from "bun";
import db from "./db.ts";
import volumePath from "./volumePath.ts";
import getItems from "./getItems.ts";

export default async function attachFile(
  ws: ServerWebSocket<unknown>,
  {
    rowId,
    name,
    mimeType,
    size,
  }: {
    rowId: string;
    name: string;
    mimeType: string;
    size: number;
  },
  data?: ArrayBufferLike
) {
  if (!data) {
    throw new Error("Missing attachment data");
  }

  const extension = name.split(".").pop() || "";
  if (
    !extension ||
    extension.length > 10 ||
    !/^[a-zA-Z0-9]+$/.test(extension)
  ) {
    throw new Error("Invalid file extension");
  }

  const uuid = crypto.randomUUID();
  const path = `${rowId}-${uuid}.${extension}`;

  await Bun.write(`${volumePath}/${path}`, data);

  db.run(
    "UPDATE items SET attachments = json_insert(attachments, '$[#]', ?) WHERE rowid = ?",
    [
      JSON.stringify({
        uuid,
        name,
        size,
        type: mimeType,
        path,
      }),
      rowId,
    ]
  );

  ws.send(JSON.stringify({ type: getItems.name, data: getItems() }));
}
