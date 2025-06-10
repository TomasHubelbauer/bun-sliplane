import Bun from "bun";
import { Database } from "bun:sqlite";
import index from "./index.html";
import fs from "fs";

if (!process.env.PASSWORD) {
  throw new Error("PASSWORD environment variable is required");
}

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

console.log(`Contents of ${VOLUME_PATH}:`);
console.log(await fs.promises.readdir(VOLUME_PATH));
console.log(`/Contents of ${VOLUME_PATH}:`);

Bun.serve({
  routes: {
    "/": index,
    "/manifest.json": () => new Response(Bun.file("./manifest.json")),
    "/:password": {
      GET: async (request) => {
        if (request.params.password !== process.env.PASSWORD) {
          return new Response(null, { status: 401 });
        }

        return Response.json(db.query("SELECT rowid, * FROM items").all());
      },
      POST: async (request) => {
        if (request.params.password !== process.env.PASSWORD) {
          return new Response(null, { status: 401 });
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
        if (request.params.password !== process.env.PASSWORD) {
          return new Response(null, { status: 401 });
        }

        const url = new URL(request.url);
        const rowId = url.searchParams.get("rowId");
        if (!rowId) {
          return new Response("'rowId' query parameter is required", {
            status: 400,
          });
        }

        db.run("DELETE FROM items WHERE rowid = ?", [rowId]);
        return new Response();
      },
      PUT: async (request) => {
        if (request.params.password !== process.env.PASSWORD) {
          return new Response(null, { status: 401 });
        }

        const url = new URL(request.url);
        const rowId = url.searchParams.get("rowId");
        if (!rowId) {
          return new Response("'rowId' query parameter is required", {
            status: 400,
          });
        }

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
    "/:password/backup": (request) => {
      if (request.params.password !== process.env.PASSWORD) {
        return new Response(null, { status: 401 });
      }

      return new Response(db.serialize(), {
        headers: {
          "Content-Type": "application/x-sqlite3",
          "Content-Disposition": `attachment; filename="backup-${new Date().toISOString()}.db"`,
        },
      });
    },
    "/:password/attach": {
      POST: async (request) => {
        if (request.params.password !== process.env.PASSWORD) {
          return new Response(null, { status: 401 });
        }

        const url = new URL(request.url);
        const rowId = url.searchParams.get("rowId");
        if (!rowId) {
          return new Response("'rowId' query parameter is required", {
            status: 400,
          });
        }

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

        await Bun.write(path, await file.arrayBuffer());
        db.run(
          "UPDATE items SET attachments = json_insert(attachments, '$[#]', ?) WHERE rowid = ?",
          [JSON.stringify(attachment), rowId]
        );

        return new Response();
      },
      GET: async (request) => {
        if (request.params.password !== process.env.PASSWORD) {
          return new Response(null, { status: 401 });
        }

        const url = new URL(request.url);
        const rowId = url.searchParams.get("rowId");
        const uuid = url.searchParams.get("uuid");
        if (!rowId || !uuid) {
          return new Response(
            "'rowId' and 'uuid' query parameters are required",
            {
              status: 400,
            }
          );
        }

        const { attachments } = db
          .query("SELECT attachments FROM items WHERE rowid = ?")
          .get(rowId) as { attachments: string };
        const files = JSON.parse(attachments || "[]").map((attachment) =>
          JSON.parse(attachment)
        );

        const file: { name: string; path: string; type: string } = files.find(
          (f) => f.uuid === uuid
        );
        console.log(file);

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
    },
  },
});
