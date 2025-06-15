import type { ServerWebSocket } from "bun";
import compareLinks from "./compareLinks.ts";

export default function monitorLinks(ws: ServerWebSocket<unknown>) {
  console.log("Monitoring links…");
  setInterval(() => compareLinks(ws, false), 60 * 1000);
}
