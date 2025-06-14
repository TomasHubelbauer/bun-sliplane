import { $, type ServerWebSocket } from "bun";
import db from "./db.ts";
import fetchBasicHtml from "./fetchBasicHtml.ts";
import formatHumanBytes from "./formatHumanBytes.ts";
import listLinks from "./listLinks.ts";
import getItems from "./getItems.ts";

export default async function compareLink(
  ws: ServerWebSocket<unknown>,
  reportLogs: boolean,
  link: {
    url: string;
    html: string;
  }
) {
  reportLogs &&
    ws.send(
      JSON.stringify({
        type: "reportForceCheckLog",
        data: `Checking link: ${link.url}`,
      })
    );

  const html = await fetchBasicHtml(link.url);

  reportLogs &&
    ws.send(
      JSON.stringify({
        type: "reportForceCheckLog",
        data: `Fetch: ${formatHumanBytes(html.length)} (${html.length} B)`,
      })
    );

  reportLogs &&
    ws.send(
      JSON.stringify({
        type: "reportForceCheckLog",
        data: `Cache: ${formatHumanBytes(link.html.length)} (${
          link.html.length
        } B)`,
      })
    );

  // See https://github.com/oven-sh/bun/issues/20396 for `util.diff` support
  // Bun shell doesn't support process substitution, so we use bash -c
  const diff =
    await $`bash -c 'diff -u <(echo "$1") <(echo "$2") | tail -n +4' -- "${link.html}" "${html}"`
      .nothrow()
      .text();

  if (!diff) {
    reportLogs &&
      ws.send(
        JSON.stringify({
          type: "reportForceCheckLog",
          data: "No diff",
        })
      );

    db.run("UPDATE links SET checkStamp = ?, changeStamp = ? WHERE url = ?", [
      new Date().toISOString(),
      new Date().toISOString(),
      link.url,
    ]);

    ws.send(
      JSON.stringify({
        type: listLinks.name,
        data: listLinks(),
      })
    );

    return;
  }

  reportLogs &&
    ws.send(
      JSON.stringify({
        type: "reportForceCheckLog",
        data: diff,
      })
    );

  db.run(
    "UPDATE links SET checkStamp = ?, changeStamp = ?, html = ? WHERE url = ?",
    [new Date().toISOString(), new Date().toISOString(), html, link.url]
  );

  ws.send(
    JSON.stringify({
      type: listLinks.name,
      data: listLinks(),
    })
  );

  db.run(`INSERT INTO items (stamp, name, text) VALUES (?, ?, ?)`, [
    new Date().toISOString(),
    `Beware ${link.url} change`,
    `${link.url} has changed:\n\`\`\`diff\n${diff}\n\`\`\``,
  ]);

  ws.send(JSON.stringify({ type: getItems.name, data: getItems() }));
}
