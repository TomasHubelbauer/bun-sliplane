import Bun from "bun";

Bun.serve({
  fetch(request) {
    return new Response("Hello from Bun!");
  },
});
