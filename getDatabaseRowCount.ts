import type { ServerWebSocket } from "bun";
import db from "./db.ts";

export default function getDatabaseRowCount(
  _ws: ServerWebSocket<unknown>,
  { table }: { table: string }
) {
  return (
    db.query(`SELECT COUNT(*) FROM ${table}`).get() as { "COUNT(*)": number }
  )["COUNT(*)"];
}
