import type { ServerWebSocket } from "bun";
import compareLink from "./compareLink.ts";
import db from "./db.ts";

export default async function compareLinks(ws: ServerWebSocket<unknown>) {
  const links = db.query("SELECT * FROM links").all() as {
    url: string;
    checkStamp: string;
    changeStamp: string;
    html: string;
    mask: string;
  }[];

  for (let index = 0; index < links.length; index++) {
    ws.send(
      JSON.stringify({
        type: "reportLinkCheckProgress",
        data: { linkIndex: index, linkCount: links.length },
      })
    );

    const link = links[index];
    await compareLink(ws, link);
  }

  ws.send(
    JSON.stringify({
      type: "reportLinkCheckProgress",
    })
  );
}
