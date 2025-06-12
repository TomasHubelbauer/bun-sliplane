import db from "./db.ts";

export default function getDatabaseItems() {
  return db.query("SELECT rowid, * FROM items").all();
}
