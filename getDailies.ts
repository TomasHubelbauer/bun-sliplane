import db from "./db.ts";

export default function getDailies() {
  return db.query("SELECT rowid, * FROM dailies").all();
}
