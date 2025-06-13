import db from "./db.ts";

export default function getDatabaseTables() {
  return db
    .query("SELECT name FROM sqlite_master WHERE type='table'")
    .all() as { name: string }[];
}
