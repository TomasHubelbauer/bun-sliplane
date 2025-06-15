import type { ServerWebSocket } from "bun";
import compareLinks from "./compareLinks.ts";

const READY_STATES = ["connecting", "open", "closing", "closed"] as const;

export default function monitorLinks(ws: ServerWebSocket<unknown>) {
  const readyState = READY_STATES[ws.readyState] || "unknown";
  console.log(
    `Monitoring links for ${ws.data} (${ws.remoteAddress}, ${readyState})…`
  );

  setInterval(() => compareLinks(ws, false), 60 * 1000);
}
