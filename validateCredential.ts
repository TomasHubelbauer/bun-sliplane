import type { BunRequest } from "bun";

if (!process.env.PASSWORD) {
  throw new Error("PASSWORD environment variable is required");
}

export default function validateCredential(request: BunRequest) {
  const authorization = request.headers.get("Authorization");
  if (!authorization || !authorization.startsWith("Basic ")) {
    return new Response(null, {
      status: 401,
      headers: {
        "WWW-Authenticate": "Basic",
      },
    });
  }

  const base64 = authorization.slice("Basic ".length);
  const [userName, password] = Buffer.from(base64, "base64")
    .toString()
    .split(":");

  if (!userName || !password || password !== process.env.PASSWORD) {
    return new Response(null, {
      status: 401,
      headers: {
        "WWW-Authenticate": "Basic",
      },
    });
  }

  return userName;
}
