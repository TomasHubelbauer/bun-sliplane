import type { ServerWebSocket } from "bun";
import db from "./db.ts";
import listLinks from "./listLinks.ts";
import fetchBasicHtml from "./fetchBasicHtml.ts";

export default async function trackLink(
  ws: ServerWebSocket<unknown>,
  { url }: { url: string }
) {
  if (!URL.canParse(url)) {
    ws.send(
      JSON.stringify({
        type: "reportError",
        data: {
          message: `Invalid URL: ${url}`,
        },
      })
    );

    return;
  }

  const html = await fetchBasicHtml(url);
  db.run(
    "INSERT INTO links (url, checkStamp, changeStamp, html) VALUES (?, ?, ?, ?)",
    [url, new Date().toISOString(), new Date().toISOString(), html]
  );

  ws.send(
    JSON.stringify({
      type: listLinks.name,
      data: listLinks(),
    })
  );
}
