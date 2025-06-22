import Bun, { type Server, type ServerWebSocket } from "bun";
import { writeHeapSnapshot } from "v8";
import index from "./index.html";
import validatePasswordAndGetUserName from "./validatePasswordAndGetUserName.ts";
import db from "./db.ts";
import getAudits from "./getAudits.ts";
import getRequestSearchParameter from "./getRequestSearchParameter.ts";
import volumePath from "./volumePath.ts";
import getMachineFiles from "./getMachineFiles.ts";
import zipDirectory from "./zipDirectory.ts";
import monitorLinks from "./monitorLinks.ts";
import parseMessage from "./parseMessage.ts";
import handlers from "./handlers.ts";

const nonce = crypto.randomUUID();

globalThis.clients = [];
const server: Server = Bun.serve({
  routes: {
    // Public
    "/manifest.json": () => new Response(Bun.file("./manifest.json")),

    // Secret
    [`/${nonce}`]: index,

    // Private
    "/": (request) => {
      const userName = validatePasswordAndGetUserName(request);
      if (!userName) {
        return new Response(null, {
          status: 401,
          headers: {
            "WWW-Authenticate": "Basic",
          },
        });
      }

      return fetch(`${server.url}/${nonce}`);
    },
    "/ws": (request) => {
      const userName = validatePasswordAndGetUserName(request);
      if (!userName) {
        return new Response(null, {
          status: 401,
          headers: {
            "WWW-Authenticate": "Basic",
          },
        });
      }

      if (
        server.upgrade(request, {
          data: userName,
        })
      ) {
        return;
      }

      return new Response("Upgrade failed", { status: 500 });
    },
    "/attachment": {
      GET: async (request) => {
        const userName = validatePasswordAndGetUserName(request);
        if (!userName) {
          return new Response(null, {
            status: 401,
            headers: {
              "WWW-Authenticate": "Basic",
            },
          });
        }

        const rowId = getRequestSearchParameter(request, "rowId");
        const uuid = getRequestSearchParameter(request, "uuid");

        const { attachments } = db
          .query("SELECT attachments FROM items WHERE rowid = ?")
          .get(rowId) as { attachments: string };
        const files = JSON.parse(attachments || "[]").map((attachment) =>
          JSON.parse(attachment)
        );

        const file: { name: string; path: string; type: string } = files.find(
          (f) => f.uuid === uuid
        );

        if (!file) {
          return new Response("Attachment not found", { status: 404 });
        }

        return new Response(Bun.file(`${volumePath}/${file.path}`), {
          headers: {
            "Content-Type": file.type,
            "Content-Disposition": `filename="${file.name}"`,
          },
        });
      },
    },
    "/backup": {
      GET: (request) => {
        const userName = validatePasswordAndGetUserName(request);
        if (!userName) {
          return new Response(null, {
            status: 401,
            headers: {
              "WWW-Authenticate": "Basic",
            },
          });
        }

        db.run(
          "INSERT INTO audits (name, stamp) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET stamp = ?",
          [
            `backup-${userName}`,
            new Date().toISOString(),
            new Date().toISOString(),
          ]
        );

        for (const client of globalThis.clients as ServerWebSocket<unknown>[]) {
          if (client.readyState === 1 && client.data === userName) {
            client.send(
              JSON.stringify({ type: getAudits.name, data: getAudits() })
            );
          }
        }

        return new Response(db.serialize(), {
          headers: {
            "Content-Type": "application/x-sqlite3",
            "Content-Disposition": `attachment; filename="backup-${userName}-${new Date().toISOString()}.db"`,
          },
        });
      },
    },
    "/snapshot/v8": {
      GET: (request) => {
        const userName = validatePasswordAndGetUserName(request);
        if (!userName) {
          return new Response(null, {
            status: 401,
            headers: {
              "WWW-Authenticate": "Basic",
            },
          });
        }

        const path = writeHeapSnapshot();

        return new Response(Bun.file(path), {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="heapsnapshot-v8-${userName}-${new Date().toISOString()}.json"`,
          },
        });
      },
    },
    "/snapshot/jsc": {
      GET: (request) => {
        const userName = validatePasswordAndGetUserName(request);
        if (!userName) {
          return new Response(null, {
            status: 401,
            headers: {
              "WWW-Authenticate": "Basic",
            },
          });
        }

        return new Response(
          JSON.stringify(Bun.generateHeapSnapshot(), null, 2),
          {
            headers: {
              "Content-Type": "application/json",
              "Content-Disposition": `attachment; filename="heapsnapshot-jsc-${userName}-${new Date().toISOString()}.json"`,
            },
          }
        );
      },
    },
    "/download/:name": {
      GET: async (request) => {
        const userName = validatePasswordAndGetUserName(request);
        if (!userName) {
          return new Response(null, {
            status: 401,
            headers: {
              "WWW-Authenticate": "Basic",
            },
          });
        }

        const entries = await getMachineFiles();
        const entry = entries.find(
          (entry) => entry.name === request.params.name
        );

        if (!entry) {
          throw new Response("File not found", { status: 404 });
        }

        if (entry.isDirectory) {
          const zip = await zipDirectory(entry.name);
          return new Response(zip, {
            headers: {
              "Content-Type": "application/zip",
              "Content-Disposition": `attachment; filename="${entry.name}.zip"`,
            },
          });
        }

        const file = Bun.file(entry.name);
        return new Response(file, {
          headers: {
            "Content-Type": file.type,
            "Content-Disposition": `attachment; filename="${entry.name}"`,
          },
        });
      },
    },
    "/preview/*": {
      GET: async (request) => {
        const userName = validatePasswordAndGetUserName(request);
        if (!userName) {
          return new Response(null, {
            status: 401,
            headers: {
              "WWW-Authenticate": "Basic",
            },
          });
        }

        const url = new URL(request.url);
        const linkUrl = url.href.slice(url.origin.length + "/preview/".length);
        if (!linkUrl) {
          return new Response("URL is required", { status: 400 });
        }

        const link = db
          .query("SELECT * FROM links WHERE url = ?")
          .get(linkUrl) as { html: string; mask: string } | undefined;
        if (!link) {
          return new Response("Link not found", { status: 404 });
        }

        const maskedLinkHtml = link.mask
          ? link.html.replace(
              new RegExp(link.mask, "g"),
              `<!-- ${link.mask} -->`
            )
          : link.html;

        return new Response(maskedLinkHtml, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
        });
      },
    },
  },
  websocket: {
    perMessageDeflate: true,
    idleTimeout: undefined,
    open(ws) {
      for (const client of globalThis.clients as ServerWebSocket<unknown>[]) {
        if (client.data === ws.data) {
          client.close(1000, "Duplicate connection");
          console.log(
            new Date()
              .toISOString()
              .slice("yyyy-mm-ddT".length, -".###Z".length),
            `Duplicate connection for ${ws.data}. Closed existing connection.`
          );
        }
      }

      globalThis.clients.push(ws);
      console.log(
        new Date().toISOString().slice("yyyy-mm-ddT".length, -".###Z".length),
        `${ws.data} connected. Clients:`,
        globalThis.clients
          .map((c) => `${c.data} (${c.readyState})`)
          .join(", ") || "none"
      );
    },
    close(ws) {
      globalThis.clients.splice(globalThis.clients.indexOf(ws), 1);
      console.log(
        new Date().toISOString().slice("yyyy-mm-ddT".length, -".###Z".length),
        `${ws.data} disconnected. Clients:`,
        globalThis.clients
          .map((c) => `${c.data} (${c.readyState})`)
          .join(", ") || "none"
      );
    },
    async message(ws, message) {
      try {
        const { type, args, data } = parseMessage(message);
        const handler = handlers.find((h) => h.name === type);
        if (!handler) {
          throw new Error(`Unknown handler: ${type}`);
        }

        const result = await handler(ws, args, data);
        if (result) {
          ws.send(JSON.stringify({ type, data: result }));
        }
      } catch (error) {
        ws.send(
          JSON.stringify({
            type: "reportError",
            data: {
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            },
          })
        );
      }
    },
  },
});

console.log(server.url.href);
monitorLinks();

process.on("exit", (code) => console.log(`Process exited with code ${code}`));
