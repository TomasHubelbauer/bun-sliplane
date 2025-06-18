import db from "./db.ts";

export default function listLinks() {
  const links = db.query("SELECT rowid, * FROM links").all() as {
    html?: string;
  }[];

  return links;
}
