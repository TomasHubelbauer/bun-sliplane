import type { ServerWebSocket } from "bun";
import compareLinks from "./compareLinks.ts";

export default async function forceCheckLinks(ws: ServerWebSocket<unknown>) {
  await compareLinks(ws, true);
}
