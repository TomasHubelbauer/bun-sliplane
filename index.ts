import Bun, { Glob } from "bun";
import index from "./index.html";

if (!process.env.PASSWORD) {
  throw new Error("PASSWORD environment variable is required");
}

const VOLUME_PATH = process.env.VOLUME_PATH ?? "./";
const GLOB = new Glob("*Z.json");

Bun.serve({
  routes: {
    "/": index,
    "/manifest.json": () => new Response(Bun.file("./manifest.json")),
    "/:password": {
      GET: async (request) => {
        if (request.params.password !== process.env.PASSWORD) {
          return new Response(null, { status: 401 });
        }

        const data: { name: string; text: string }[] = [];
        for await (const name of GLOB.scan(VOLUME_PATH)) {
          data.push({
            name,
            text: await Bun.file(`${VOLUME_PATH}/${name}`).text(),
          });
        }

        data.sort((a, b) => b.name.localeCompare(a.name));
        return Response.json(data);
      },
      POST: async (request) => {
        if (request.params.password !== process.env.PASSWORD) {
          return new Response(null, { status: 401 });
        }

        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        const text = await request.text();
        await Bun.write(`${VOLUME_PATH}/${stamp}.json`, text);
        return new Response();
      },
      DELETE: async (request) => {
        console.log("Deleting file:", request.url);
        if (request.params.password !== process.env.PASSWORD) {
          return new Response(null, { status: 401 });
        }

        const url = new URL(request.url);
        const name = url.searchParams.get("name");
        if (!name) {
          return new Response("Name query parameter is required", {
            status: 400,
          });
        }

        try {
          await Bun.file(`${VOLUME_PATH}/${name}`).unlink();
          return new Response();
        } catch (error) {
          return new Response("File not found", { status: 404 });
        }
      },
      PUT: async (request) => {
        if (request.params.password !== process.env.PASSWORD) {
          return new Response(null, { status: 401 });
        }

        const url = new URL(request.url);
        const name = url.searchParams.get("name");
        if (!name) {
          return new Response("Name query parameter is required", {
            status: 400,
          });
        }

        const text = await request.text();
        await Bun.write(`${VOLUME_PATH}/${name}`, text);
        return new Response();
      },
    },
  },
});
