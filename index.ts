import Bun from "bun";
import fs from "node:fs";

const REPLACE_FILE_PATH = "/data/data.txt";
const APPEND_FILE_PATH = "/data/data_append.txt";

Bun.serve({
  routes: {
    "/api": {
      GET: async () => new Response(await Bun.file(REPLACE_FILE_PATH).text()),
      POST: async (request: Request) => {
        await Bun.file(REPLACE_FILE_PATH).write(new Date().toISOString());
        return new Response();
      },
    },
    "/:password": {
      GET: async (request) => {
        if (request.params.password !== process.env.PASSWORD) {
          return new Response(null, { status: 401 });
        }

        return new Response(await Bun.file(APPEND_FILE_PATH).text());
      },
      POST: async (request) => {
        if (request.params.password !== process.env.PASSWORD) {
          return new Response(null, { status: 401 });
        }

        const data = await request.text();
        await fs.promises.appendFile(APPEND_FILE_PATH, data + "\n");
        return new Response(await Bun.file(APPEND_FILE_PATH).text());
      },
    },
  },
  fetch() {
    return new Response("Hello from Bun!");
  },
});
