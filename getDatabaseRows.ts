import type { ServerWebSocket } from "bun";
import db from "./db.ts";

export default function getDatabaseRows(
  _ws: ServerWebSocket<unknown>,
  {
    table,
    pageIndex,
    pageSize,
  }: { table: string; pageIndex: number; pageSize: number }
) {
  return db
    .query(
      `SELECT rowid, * FROM ${table} LIMIT ${pageSize} OFFSET ${
        pageIndex * pageSize
      }`
    )
    .all();
}
