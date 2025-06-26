import db from "./db.ts";

export default function getErrands() {
  return db.query("SELECT rowid, * FROM errands ORDER BY rowid DESC").all();
}
