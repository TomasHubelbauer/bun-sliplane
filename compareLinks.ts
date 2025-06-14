import type { ServerWebSocket } from "bun";
import compareLink from "./compareLink.ts";
import db from "./db.ts";

export default async function compareLinks(ws: ServerWebSocket<unknown>) {
  const links = db.query("SELECT * FROM links").all() as {
    url: string;
    checkStamp: string;
    changeStamp: string;
    html: string;
  }[];

  for (const link of links) {
    await compareLink(ws, link);
  }
}
