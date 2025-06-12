import db from "./db.ts";

export default function getItems() {
  return db.query("SELECT rowid, * FROM items ORDER BY stamp DESC").all();
}
