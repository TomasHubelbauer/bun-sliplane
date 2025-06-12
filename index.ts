import Bun from "bun";
import { Database } from "bun:sqlite";
import index from "./index.html";
import fs from "fs";
import enforceAuthorization from "./enforceAuthorization.ts";
import getRequestSearchParameter from "./getRequestSearchParameter.ts";

const VOLUME_PATH = process.env.VOLUME_PATH ?? ".";
const DATABASE_PATH = VOLUME_PATH + "/db.sqlite";
const db = new Database(DATABASE_PATH);

db.run(
  "CREATE TABLE IF NOT EXISTS items (stamp TEXT PRIMARY KEY, name TEXT, text TEXT)"
);

try {
  db.run('ALTER TABLE items ADD COLUMN attachments TEXT DEFAULT "[]"');
} catch (error) {
  if (error.message !== "duplicate column name: attachments") {
    throw error;
  }
}

db.run("CREATE TABLE IF NOT EXISTS audits (name TEXT PRIMARY KEY, stamp TEXT)");

const nonce = crypto.randomUUID();

const server = Bun.serve({
  routes: {
    [`/${nonce}`]: index,
    "/": (request) => {
      const authResponse = enforceAuthorization(request);
      if (authResponse) {
        return authResponse;
      }

      return fetch(`${server.url}/${nonce}`);
    },
    "/manifest.json": () => new Response(Bun.file("./manifest.json")),
    "/items": {
      GET: async (request) => {
        const authResponse = enforceAuthorization(request);
        if (authResponse) {
          return authResponse;
        }

        return Response.json(
          db.query("SELECT rowid, * FROM items ORDER BY stamp DESC").all()
        );
      },
      POST: async (request) => {
        const authResponse = enforceAuthorization(request);
        if (authResponse) {
          return authResponse;
        }

        const { name, text } = await request.json();
        db.run("INSERT INTO items (stamp, name, text) VALUES (?, ?, ?)", [
          new Date().toISOString(),
          name,
          text,
        ]);

        return new Response();
      },
      DELETE: async (request) => {
        const authResponse = enforceAuthorization(request);
        if (authResponse) {
          return authResponse;
        }

        const rowId = getRequestSearchParameter(request, "rowId");

        const { attachments } = db
          .query("SELECT attachments FROM items WHERE rowid = ?")
          .get(rowId) as { attachments: string };
        const files = JSON.parse(attachments || "[]").map((attachment) =>
          JSON.parse(attachment)
        );

        for (const file of files) {
          const filePath = `${VOLUME_PATH}/${file.path}`;
          await Bun.file(filePath).unlink();
        }

        db.run("DELETE FROM items WHERE rowid = ?", [rowId]);
        return new Response();
      },
      PUT: async (request) => {
        const authResponse = enforceAuthorization(request);
        if (authResponse) {
          return authResponse;
        }

        const rowId = getRequestSearchParameter(request, "rowId");

        const item = await request.json();

        if ("name" in item) {
          db.run("UPDATE items SET name = ? WHERE rowid = ?", [
            item.name,
            rowId,
          ]);
        }

        if ("text" in item) {
          db.run("UPDATE items SET text = ? WHERE rowid = ?", [
            item.text,
            rowId,
          ]);
        }

        return new Response();
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
    "/audits": (request) => {
      const authResponse = enforceAuthorization(request);
      if (authResponse) {
        return authResponse;
      }

      return Response.json(db.query("SELECT * FROM audits").all());
    },
    "/stats": async (request) => {
      const authResponse = enforceAuthorization(request);
      if (authResponse) {
        return authResponse;
      }

      const stats = await fs.promises.statfs(VOLUME_PATH);
      return Response.json(stats);
    },
    "/attach": {
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

        await Bun.write(VOLUME_PATH + "/" + path, await file.arrayBuffer());
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

        return new Response(Bun.file(`${VOLUME_PATH}/${file.path}`), {
          headers: {
            "Content-Type": file.type,
            "Content-Disposition": `filename="${file.name}"`,
          },
        });
      },
      DELETE: async (request) => {
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

        const fileIndex = files.findIndex((f) => f.uuid === uuid);
        if (fileIndex === -1) {
          return new Response("Attachment not found", { status: 404 });
        }

        const filePath = `${VOLUME_PATH}/${files[fileIndex].path}`;
        await Bun.file(filePath).unlink();

        files.splice(fileIndex, 1);
        db.run("UPDATE items SET attachments = ? WHERE rowid = ?", [
          JSON.stringify(files),
          rowId,
        ]);

        return new Response();
      },
    },
    "/volume": {
      GET: async (request) => {
        const authResponse = enforceAuthorization(request);
        if (authResponse) {
          return authResponse;
        }

        const items = await fs.promises.readdir(VOLUME_PATH, {
          withFileTypes: true,
        });

        const files = items.filter((item) => item.isFile());
        const filesWithStats = await Promise.all(
          files.map(async (file) => {
            const stats = await fs.promises.stat(`${VOLUME_PATH}/${file.name}`);
            return { ...file, ...stats };
          })
        );

        return Response.json(filesWithStats);
      },
      DELETE: async (request) => {
        const authResponse = enforceAuthorization(request);
        if (authResponse) {
          return authResponse;
        }

        const name = getRequestSearchParameter(request, "name");
        await Bun.file(`${VOLUME_PATH}/${name}`).unlink();
        return new Response();
      },
    },
    "/database": {
      GET: async (request) => {
        const authResponse = enforceAuthorization(request);
        if (authResponse) {
          return authResponse;
        }

        return Response.json(db.query("SELECT rowid, * FROM items").all());
      },
      PUT: async (request) => {
        const authResponse = enforceAuthorization(request);
        if (authResponse) {
          return authResponse;
        }

        const rowId = getRequestSearchParameter(request, "rowId");
        const key = getRequestSearchParameter(request, "key");
        const value = await request.text();

        if (!rowId || !key || !value) {
          return new Response("Missing required parameters", { status: 400 });
        }

        if (
          key !== "stamp" &&
          key !== "name" &&
          key !== "text" &&
          key !== "attachments"
        ) {
          return new Response("Invalid key", { status: 400 });
        }

        db.run(`UPDATE items SET ${key} = ? WHERE rowid = ?`, [value, rowId]);
        return new Response();
      },
      DELETE: async (request) => {
        const authResponse = enforceAuthorization(request);
        if (authResponse) {
          return authResponse;
        }

        const rowId = getRequestSearchParameter(request, "rowId");
        if (!rowId) {
          return new Response("Missing 'rowId' parameter", { status: 400 });
        }

        db.run("DELETE FROM items WHERE rowid = ?", [rowId]);
        return new Response();
      },
    },
  },
});

console.log(server.url.href);
