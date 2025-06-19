import Bun, { type Server, type ServerWebSocket } from "bun";
import index from "./index.html";
import validatePasswordAndGetUserName from "./validatePasswordAndGetUserName.ts";
import db from "./db.ts";
import getItems from "./getItems.ts";
import getAudits from "./getAudits.ts";
import getStats from "./getStats.ts";
import getRequestSearchParameter from "./getRequestSearchParameter.ts";
import volumePath from "./volumePath.ts";
import getVolumeFiles from "./getVolumeFiles.ts";
import createItem from "./createItem.ts";
import deleteItem from "./deleteItem.ts";
import updateItem from "./updateItem.ts";
import deleteAttachment from "./deleteAttachment.ts";
import deleteVolumeFile from "./deleteVolumeFile.ts";
import updateDatabaseCell from "./updateDatabaseCell.ts";
import deleteDatabaseRow from "./deleteDatabaseRow.ts";
import getUserName from "./getUserName.ts";
import getDatabaseTables from "./getDatabaseTables.ts";
import getDatabaseColumns from "./getDatabaseColumns.ts";
import getDatabaseRows from "./getDatabaseRows.ts";
import fetchUrlMetadata from "./fetchUrlMetadata.ts";
import trackLink from "./trackLink.ts";
import listLinks from "./listLinks.ts";
import deleteLink from "./deleteLink.ts";
import deleteDatabaseTable from "./deleteDatabaseTable.ts";
import forceCheckLink from "./forceCheckLink.ts";
import calculateDatabaseSize from "./calculateDatabaseSize.ts";
import getMachineFiles from "./getMachineFiles.ts";
import zipDirectory from "./zipDirectory.ts";
import deleteDatabaseRows from "./deleteDatabaseRows.ts";
import getDatabaseRowCount from "./getDatabaseRowCount.ts";
import setLinkMask from "./setLinkMask.ts";
import fetchLinkDetail from "./fetchLinkDetail.ts";
import monitorLinks from "./monitorLinks.ts";

const nonce = crypto.randomUUID();

const handlers = [
  getStats,
  getAudits,
  getItems,
  createItem,
  deleteItem,
  updateItem,
  deleteAttachment,
  getVolumeFiles,
  deleteVolumeFile,
  updateDatabaseCell,
  deleteDatabaseRow,
  getUserName,
  getDatabaseTables,
  getDatabaseColumns,
  getDatabaseRows,
  fetchUrlMetadata,
  trackLink,
  listLinks,
  deleteLink,
  deleteDatabaseTable,
  forceCheckLink,
  calculateDatabaseSize,
  getMachineFiles,
  deleteDatabaseRows,
  getDatabaseRowCount,
  setLinkMask,
  fetchLinkDetail,
] as const;

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
      POST: async (request) => {
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

        const formData = await request.formData();
        const file = formData.get("file");
        if (!(file instanceof File)) {
          return new Response("'file' form field is required", { status: 400 });
        }

        const uuid = crypto.randomUUID();
        const extension = file.name.split(".").pop() || "";
        if (
          !extension ||
          extension.length > 10 ||
          !/^[a-zA-Z0-9]+$/.test(extension)
        ) {
          return new Response("Invalid file extension", { status: 400 });
        }

        const path = `${rowId}-${uuid}.${extension}`;
        const attachment = {
          uuid,
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          path,
        };

        await Bun.write(`${volumePath}/${path}`, await file.arrayBuffer());
        db.run(
          "UPDATE items SET attachments = json_insert(attachments, '$[#]', ?) WHERE rowid = ?",
          [JSON.stringify(attachment), rowId]
        );

        return new Response();
      },
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
        const { type, ...args } = JSON.parse(message as string);
        const handler = handlers.find((h) => h.name === type);
        if (!handler) {
          throw new Error(`Unknown handler: ${type}`);
        }

        const data = await handler(ws, args);
        if (data) {
          ws.send(JSON.stringify({ type, data }));
        }

        return;
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
