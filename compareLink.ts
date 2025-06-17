import { $, type ServerWebSocket } from "bun";
import db from "./db.ts";
import fetchBasicHtml from "./fetchBasicHtml.ts";
import formatHumanBytes from "./formatHumanBytes.ts";
import listLinks from "./listLinks.ts";
import getItems from "./getItems.ts";
import getAudits from "./getAudits.ts";

export default async function compareLink(
  ws: ServerWebSocket<unknown>,
  link: {
    url: string;
    html: string;
    mask: string;
  }
) {
  ws.send(
    JSON.stringify({
      type: "reportLinkCheckLog",
      data: `Checking link: ${link.url}`,
    })
  );

  const html = await fetchBasicHtml(link.url);

  ws.send(
    JSON.stringify({
      type: "reportLinkCheckLog",
      data: `Fetch: ${formatHumanBytes(html.length)} (${html.length} B)`,
    })
  );

  ws.send(
    JSON.stringify({
      type: "reportLinkCheckLog",
      data: `Cache: ${formatHumanBytes(link.html.length)} (${
        link.html.length
      } B)`,
    })
  );

  const maskedLinkHtml = link.mask
    ? link.html.replace(new RegExp(link.mask, "g"), `<!-- ${link.mask} -->`)
    : link.html;

  const maskedHtml = link.mask
    ? html.replace(new RegExp(link.mask, "g"), `<!-- ${link.mask} -->`)
    : html;

  // See https://github.com/oven-sh/bun/issues/20396 for `util.diff` support
  // Bun shell doesn't support process substitution, so we use bash -c
  const diff =
    await $`bash -c 'diff -u <(echo "$1") <(echo "$2") | tail -n +4' -- "${maskedLinkHtml}" "${maskedHtml}"`
      .nothrow()
      .text();

  if (!diff) {
    ws.send(
      JSON.stringify({
        type: "reportLinkCheckLog",
        data: "No diff",
      })
    );

    db.run("UPDATE links SET checkStamp = ? WHERE url = ?", [
      new Date().toISOString(),
      link.url,
    ]);

    ws.send(
      JSON.stringify({
        type: listLinks.name,
        data: listLinks(),
      })
    );

    db.run(
      "INSERT INTO audits (name, stamp) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET stamp = ?",
      [
        `link-check-${ws.data}`,
        new Date().toISOString(),
        new Date().toISOString(),
      ]
    );

    ws.send(JSON.stringify({ type: getAudits.name, data: getAudits() }));

    return;
  }

  ws.send(
    JSON.stringify({
      type: "reportLinkCheckLog",
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

  db.run(
    "INSERT INTO audits (name, stamp) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET stamp = ?",
    [
      `link-check-${ws.data}`,
      new Date().toISOString(),
      new Date().toISOString(),
    ]
  );

  ws.send(JSON.stringify({ type: getAudits.name, data: getAudits() }));
}
