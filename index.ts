import Bun from "bun";

const FILE_PATH = "/data/data.txt";

Bun.serve({
  routes: {
    "/api": {
      GET: async () => new Response(await Bun.file(FILE_PATH).text()),
      POST: async (request: Request) => {
        await Bun.file(FILE_PATH).write(new Date().toISOString());
        return new Response();
      },
    },
  },
  fetch(request) {
    return new Response("Hello from Bun!");
  },
});
