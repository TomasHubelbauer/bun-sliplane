import type { BunRequest } from "bun";

export default function enforceAuthorization(
  request: BunRequest<`/:password${string}`>
) {
  if (request.params.password !== process.env.PASSWORD) {
    throw new Response("Unauthorized");
  }
}
