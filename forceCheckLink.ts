import type { ServerWebSocket } from "bun";
import compareLink from "./compareLink.ts";
import db from "./db.ts";

export default async function forceCheckLink(
  ws: ServerWebSocket<unknown>,
  { url }: { url: string }
) {
  const link = db.query("SELECT * FROM links WHERE url = ?").get(url) as {
    url: string;
    checkStamp: string;
    changeStamp: string;
    html: string;
  };

  await compareLink(ws, true, link);
}
