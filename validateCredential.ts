import type { BunRequest } from "bun";

if (!process.env.PASSWORD) {
  throw new Error("PASSWORD environment variable is required");
}

export default function validateCredential(request: BunRequest) {
  // Accept authorization via the HTTP Basic Auth flow in the browser (works
  // well on desktop) or a cookie with the same value (works well on mobile).
  const authorization =
    request.cookies.get("bun-sliplane") ?? request.headers.get("Authorization");
  if (!authorization || !authorization.startsWith("Basic ")) {
    const response = new Response(null, {
      status: 401,
      headers: {
        "WWW-Authenticate": "Basic",
      },
    });

    const cookieMap = new Bun.CookieMap();
    cookieMap.delete("bun-sliplane");
    response.headers.set("Set-Cookie", cookieMap.toSetCookieHeaders()[0]);
    return response;
  }

  const base64 = authorization.slice("Basic ".length);
  const [userName, password] = Buffer.from(base64, "base64")
    .toString()
    .split(":");

  if (!userName || !password || password !== process.env.PASSWORD) {
    const response = new Response(null, {
      status: 401,
      headers: {
        "WWW-Authenticate": "Basic",
      },
    });

    const cookieMap = new Bun.CookieMap();
    cookieMap.delete("bun-sliplane");
    response.headers.set("Set-Cookie", cookieMap.toSetCookieHeaders()[0]);
    return response;
  }

  return userName;
}
