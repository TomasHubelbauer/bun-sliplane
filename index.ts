import Bun from "bun";
import { Database } from "bun:sqlite";
import index from "./index.html";

if (!process.env.PASSWORD) {
  throw new Error("PASSWORD environment variable is required");
}

const VOLUME_PATH = process.env.VOLUME_PATH ?? ".";
const DATABASE_PATH = VOLUME_PATH + "/db.sqlite";
const db = new Database(DATABASE_PATH);
db.run(
  "CREATE TABLE IF NOT EXISTS items (stamp TEXT PRIMARY KEY, name TEXT, text TEXT)"
);

Bun.serve({
  routes: {
    "/": index,
    "/manifest.json": () => new Response(Bun.file("./manifest.json")),
    "/:password": {
      GET: async (request) => {
        if (request.params.password !== process.env.PASSWORD) {
          return new Response(null, { status: 401 });
        }

        return Response.json(db.query("SELECT * FROM items").all());
      },
      POST: async (request) => {
        if (request.params.password !== process.env.PASSWORD) {
          return new Response(null, { status: 401 });
        }

        const text = await request.text();
        db.run("INSERT INTO items (stamp, name, text) VALUES (?, ?, ?)", [
          new Date().toISOString(),
          new Date().toISOString(),
          text,
        ]);

        return new Response();
      },
      DELETE: async (request) => {
        console.log("Deleting file:", request.url);
        if (request.params.password !== process.env.PASSWORD) {
          return new Response(null, { status: 401 });
        }

        const url = new URL(request.url);
        const stamp = url.searchParams.get("stamp");
        if (!stamp) {
          return new Response("'stamp' query parameter is required", {
            status: 400,
          });
        }

        db.run("DELETE FROM items WHERE stamp = ?", [stamp]);
        return new Response();
      },
      PUT: async (request) => {
        if (request.params.password !== process.env.PASSWORD) {
          return new Response(null, { status: 401 });
        }

        const url = new URL(request.url);
        const stamp = url.searchParams.get("stamp");
        if (!stamp) {
          return new Response("'stamp' query parameter is required", {
            status: 400,
          });
        }

        const item = await request.json();

        if ("name" in item) {
          db.run("UPDATE items SET name = ? WHERE stamp = ?", [
            item.name,
            stamp,
          ]);
        }

        if ("text" in item) {
          db.run("UPDATE items SET text = ? WHERE stamp = ?", [
            item.text,
            stamp,
          ]);
        }

        return new Response();
      },
    },
  },
});
