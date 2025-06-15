import type { ServerWebSocket } from "bun";
import compareLink from "./compareLink.ts";
import db from "./db.ts";
import getAudits from "./getAudits.ts";

const READY_STATES = ["connecting", "open", "closing", "closed"] as const;

export default async function compareLinks(
  ws: ServerWebSocket<unknown>,
  reportLogs: boolean
) {
  const readyState = READY_STATES[ws.readyState] || "unknown";
  console.log(
    `Comparing links for ${ws.data} (${ws.remoteAddress}, ${readyState})…`
  );

  const links = db.query("SELECT * FROM links").all() as {
    url: string;
    checkStamp: string;
    changeStamp: string;
    html: string;
  }[];

  for (const link of links) {
    compareLink(ws, reportLogs, link);
  }

  db.run(
    "INSERT INTO audits (name, stamp) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET stamp = ?",
    [
      `link-check-${ws.data}`,
      new Date().toISOString(),
      new Date().toISOString(),
    ]
  );

  ws.send(JSON.stringify({ type: getAudits.name, data: getAudits() }));
}
