import Bun from "bun";
import index from "./index.html";
import enforceAuthorization from "./enforceAuthorization.ts";
import db from "./db.ts";
import getItems from "./getItems.ts";
import getAudits from "./getAudits.ts";
import getStats from "./getStats.ts";
import getRequestSearchParameter from "./getRequestSearchParameter.ts";
import volumePath from "./volumePath.ts";
import getVolumeFiles from "./getVolumeFiles.ts";
import getDatabaseItems from "./getDatabaseItems.ts";

const nonce = crypto.randomUUID();

const server = Bun.serve({
  routes: {
    // Public
    "/manifest.json": () => new Response(Bun.file("./manifest.json")),

    // Secret
    [`/${nonce}`]: index,

    // Private
    "/": (request) => {
      const authResponse = enforceAuthorization(request);
      if (authResponse) {
        return authResponse;
      }

      return fetch(`${server.url}/${nonce}`);
    },
    "/ws": (request) => {
      const authResponse = enforceAuthorization(request);
      if (authResponse) {
        return authResponse;
      }

      if (server.upgrade(request)) {
        return;
      }

      return new Response("Upgrade failed", { status: 500 });
    },
    "/attachment": {
      POST: async (request) => {
        const authResponse = enforceAuthorization(request);
        if (authResponse) {
          return authResponse;
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
        const authResponse = enforceAuthorization(request);
        if (authResponse) {
          return authResponse;
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
    "/backup": (request) => {
      const authResponse = enforceAuthorization(request);
      if (authResponse) {
        return authResponse;
      }

      db.run(
        "INSERT INTO audits (name, stamp) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET stamp = ?",
        ["backup", new Date().toISOString(), new Date().toISOString()]
      );

      return new Response(db.serialize(), {
        headers: {
          "Content-Type": "application/x-sqlite3",
          "Content-Disposition": `attachment; filename="backup-${new Date().toISOString()}.db"`,
        },
      });
    },
  },
  websocket: {
    perMessageDeflate: true,
    async open(ws) {
      ws.send(JSON.stringify({ type: getItems.name, data: getItems() }));
      ws.send(JSON.stringify({ type: getAudits.name, data: getAudits() }));
      ws.send(JSON.stringify({ type: getStats.name, data: await getStats() }));
    },
    async message(ws, message) {
      const { type, ...data } = JSON.parse(message as string);
      switch (type) {
        case "getAudits": {
          ws.send(JSON.stringify({ type: getAudits.name, data: getAudits() }));
          break;
        }
        case "getItems": {
          ws.send(JSON.stringify({ type: getItems.name, data: getItems() }));
          break;
        }
        case "createItem": {
          const { name, text } = data;
          db.run("INSERT INTO items (stamp, name, text) VALUES (?, ?, ?)", [
            new Date().toISOString(),
            name,
            text,
          ]);

          ws.send(JSON.stringify({ type: getItems.name, data: getItems() }));
          break;
        }
        case "deleteItem": {
          const { attachments } = db
            .query("SELECT attachments FROM items WHERE rowid = ?")
            .get(data.rowId) as { attachments: string };
          const files = JSON.parse(attachments || "[]").map((attachment) =>
            JSON.parse(attachment)
          );

          for (const file of files) {
            const filePath = `${volumePath}/${file.path}`;
            await Bun.file(filePath).unlink();
          }

          db.run("DELETE FROM items WHERE rowid = ?", [data.rowId]);
          ws.send(JSON.stringify({ type: getItems.name, data: getItems() }));
          break;
        }
        case "updateItem": {
          if ("name" in data) {
            db.run("UPDATE items SET name = ? WHERE rowid = ?", [
              data.name,
              data.rowId,
            ]);
          }

          if ("text" in data) {
            db.run("UPDATE items SET text = ? WHERE rowid = ?", [
              data.text,
              data.rowId,
            ]);
          }

          ws.send(JSON.stringify({ type: getItems.name, data: getItems() }));
          break;
        }
        case "deleteAttachment": {
          const { attachments } = db
            .query("SELECT attachments FROM items WHERE rowid = ?")
            .get(data.rowId) as { attachments: string };
          const files = JSON.parse(attachments || "[]").map((attachment) =>
            JSON.parse(attachment)
          );

          const fileIndex = files.findIndex((f) => f.uuid === data.uuid);
          if (fileIndex === -1) {
            throw new Error("Attachment not found");
          }

          const filePath = `${volumePath}/${files[fileIndex].path}`;
          await Bun.file(filePath).unlink();

          files.splice(fileIndex, 1);
          db.run("UPDATE items SET attachments = ? WHERE rowid = ?", [
            JSON.stringify(files),
            data.rowId,
          ]);

          ws.send(JSON.stringify({ type: getItems.name, data: getItems() }));
          break;
        }
        case "getVolumeFiles": {
          ws.send(
            JSON.stringify({
              type: "getVolumeFiles",
              data: await getVolumeFiles(),
            })
          );

          break;
        }
        case "deleteVolumeFile": {
          await Bun.file(`${volumePath}/${data.name}`).unlink();
          ws.send(
            JSON.stringify({
              type: "getVolumeFiles",
              data: await getVolumeFiles(),
            })
          );
        }
        case "getDatabaseItems": {
          ws.send(
            JSON.stringify({
              type: "getDatabaseItems",
              data: getDatabaseItems(),
            })
          );
          break;
        }
        case "updateDatabaseItem": {
          const { rowId, key, value } = data;

          if (!rowId || !key || !value) {
            throw new Error("Missing required parameters");
          }

          if (
            key !== "stamp" &&
            key !== "name" &&
            key !== "text" &&
            key !== "attachments"
          ) {
            throw new Error("Invalid key");
          }

          db.run(`UPDATE items SET ${key} = ? WHERE rowid = ?`, [value, rowId]);

          ws.send(
            JSON.stringify({
              type: "getDatabaseItems",
              data: getDatabaseItems(),
            })
          );

          ws.send(
            JSON.stringify({
              type: "getItems",
              data: getItems(),
            })
          );

          break;
        }
        case "deleteDatabaseItem": {
          db.run("DELETE FROM items WHERE rowid = ?", [data.rowId]);

          ws.send(
            JSON.stringify({
              type: "getDatabaseItems",
              data: getDatabaseItems(),
            })
          );

          ws.send(
            JSON.stringify({
              type: "getItems",
              data: getItems(),
            })
          );

          break;
        }
        default: {
          throw new Error(`Unknown message type: ${type}`);
        }
      }
    },
  },
});

console.log(server.url.href);
