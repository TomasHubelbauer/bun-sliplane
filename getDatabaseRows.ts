import type { ServerWebSocket } from "bun";
import db from "./db.ts";

export default function getDatabaseRows(
  _ws: ServerWebSocket<unknown>,
  { table }: { table: string }
) {
  return db.query(`SELECT rowid, * FROM ${table}`).all();
}
