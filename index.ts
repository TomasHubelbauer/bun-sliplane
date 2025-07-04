import Bun, { type Server, type ServerWebSocket } from "bun";
import index from "./index.html";
import validateCredential from "./validateCredential.ts";
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
  development: {
    // Disable HMR on Sliplane as the HMR web socket reconnects reload the page
    hmr: process.env.HOSTNAME !== "bun-sliplane",
  },
  routes: {
    // Public
    "/manifest.json": () => new Response(Bun.file("./manifest.json")),
    "/icon-192.png": () => new Response(Bun.file("./icon-192.png")),
    "/icon-512.png": () => new Response(Bun.file("./icon-512.png")),

    // Secret
    [`/${nonce}`]: index,

    // Private
    "/": async (request) => {
      const credential = validateCredential(request);
      if (credential instanceof Response) {
        return credential;
      }

      const response = await fetch(`${server.url}/${nonce}`);

      const cookieMap = new Bun.CookieMap();
      cookieMap.set("bun-sliplane", request.headers.get("Authorization")!, {
        sameSite: "strict",
        httpOnly: true,
        secure: process.env.HOSTNAME === "bun-sliplane",
      });

      response.headers.set("Set-Cookie", cookieMap.toSetCookieHeaders()[0]);
      return response;
    },
    "/ws": (request) => {
      const credential = validateCredential(request);
      if (credential instanceof Response) {
        return credential;
      }

      if (
        server.upgrade(request, {
          data: credential,
        })
      ) {
        return;
      }

      return new Response("Upgrade failed", { status: 500 });
    },
    "/attachment": {
      GET: async (request) => {
        const credential = validateCredential(request);
        if (credential instanceof Response) {
          return credential;
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
        const credential = validateCredential(request);
        if (credential instanceof Response) {
          return credential;
        }

        db.run(
          "INSERT INTO audits (name, stamp) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET stamp = ?",
          [
            `backup-${credential}`,
            new Date().toISOString(),
            new Date().toISOString(),
          ]
        );

        for (const client of globalThis.clients as ServerWebSocket<unknown>[]) {
          if (client.readyState === 1 && client.data === credential) {
            client.send(
              JSON.stringify({ type: getAudits.name, data: getAudits() })
            );
          }
        }

        return new Response(db.serialize(), {
          headers: {
            "Content-Type": "application/x-sqlite3",
            "Content-Disposition": `attachment; filename="backup-${credential}-${new Date().toISOString()}.db"`,
          },
        });
      },
    },
    "/download/:name": {
      GET: async (request) => {
        const credential = validateCredential(request);
        if (credential instanceof Response) {
          return credential;
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
        const credential = validateCredential(request);
        if (credential instanceof Response) {
          return credential;
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
