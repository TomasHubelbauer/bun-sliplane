import db from "./db.ts";

export default function listLinks() {
  const links = db.query("SELECT * FROM links").all() as { html?: string }[];

  for (const link of links) {
    delete link.html;
  }

  return links;
}
