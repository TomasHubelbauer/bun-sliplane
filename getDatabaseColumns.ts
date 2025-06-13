import type { ServerWebSocket } from "bun";
import db from "./db.ts";

export default function getDatabaseColumns(
  _ws: ServerWebSocket<unknown>,
  { table }: { table: string }
) {
  return db.query(`PRAGMA table_info('${table}')`).all() as { name: string }[];
}
