import type { ServerWebSocket } from "bun";
import compareLink from "./compareLink.ts";
import db from "./db.ts";

export default async function compareLinks(
  clients: ServerWebSocket<unknown>[]
) {
  const links = db.query("SELECT * FROM links").all() as {
    url: string;
    checkStamp: string;
    changeStamp: string;
    html: string;
    mask: string;
    runMaskPositive: string;
    runMaskNegative: string;
  }[];

  for (let index = 0; index < links.length; index++) {
    for (const client of clients) {
      if (client.readyState === 1) {
        client.send(
          JSON.stringify({
            type: "reportLinkCheckProgress",
            data: { linkIndex: index, linkCount: links.length },
          })
        );
      }
    }

    const link = links[index];
    await compareLink(clients, link);
  }

  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(
        JSON.stringify({
          type: "reportLinkCheckProgress",
        })
      );
    }
  }
}
