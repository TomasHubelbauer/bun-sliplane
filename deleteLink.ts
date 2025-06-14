import type { ServerWebSocket } from "bun";
import db from "./db.ts";
import listLinks from "./listLinks.ts";

export default function deleteLink(
  ws: ServerWebSocket<unknown>,
  { url }: { url: string }
) {
  if (!URL.canParse(url)) {
    ws.send(
      JSON.stringify({
        type: "reportError",
        message: `Invalid URL: ${url}`,
      })
    );

    return;
  }

  db.run("DELETE FROM links WHERE url = ?", [url]);

  ws.send(
    JSON.stringify({
      type: listLinks.name,
      data: listLinks(),
    })
  );
}
