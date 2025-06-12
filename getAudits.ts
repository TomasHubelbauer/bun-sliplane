import db from "./db.ts";

export default function getAudits() {
  return db.query("SELECT * FROM audits").all();
}
