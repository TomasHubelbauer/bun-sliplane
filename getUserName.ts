import type { ServerWebSocket } from "bun";

export default function getUserName(ws: ServerWebSocket<unknown>) {
  return ws.data as string;
}
