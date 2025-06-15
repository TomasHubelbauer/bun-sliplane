import type { ServerWebSocket } from "bun";

const cache: Record<
  string,
  {
    stamp: string;
    url: string;
    icon: string | undefined;
    type: string | undefined;
    title: string | undefined;
  }
> = {};

export default async function fetchUrlMetadata(
  _ws: ServerWebSocket<unknown>,
  { url }: { url: string }
) {
  if (cache[url]) {
    // Delete if older than 1 hour
    if (
      cache[url].stamp &&
      new Date(cache[url].stamp).getTime() < Date.now() - 3600000
    ) {
      delete cache[url];
    } else {
      return cache[url];
    }
  }

  const { origin } = new URL(url);
  let icon: string | undefined;
  let type: string | undefined;
  let title: string | undefined;

  const faviconResponse = await fetch(`${origin}/favicon.ico`);
  if (faviconResponse.ok) {
    const blob = await faviconResponse.blob();
    if (blob.type.startsWith("image/")) {
      icon = Buffer.from(await blob.arrayBuffer()).toString("base64");
      type = blob.type;
    }
  }

  const htmlResponse = await fetch(url);
  if (htmlResponse.ok) {
    const text = await htmlResponse.text();

    const iconRelHrefMatch = text.match(
      /<link[^>]+rel=["']?(shortcut )?icon["']?[^>]*href=["']?(?<url>[^"'>]+)["']?/i
    );

    const iconHrefRelMatch = text.match(
      /<link[^>]+href=["']?(?<url>[^"'>]+)["']?[^>]*rel=["']?(shortcut )?icon["']?/i
    );

    const iconMatch = iconRelHrefMatch || iconHrefRelMatch;
    if (iconMatch?.groups?.url) {
      const iconResponse = await fetch(new URL(iconMatch.groups.url, url));
      if (iconResponse.ok) {
        const blob = await iconResponse.blob();
        if (blob.type.startsWith("image/")) {
          icon = Buffer.from(await blob.arrayBuffer()).toString("base64");
          type = blob.type;
        }
      }
    }

    const titleMatch = text.match(/<title>(.*?)<\/title>/i);
    title = titleMatch?.[1].replace("&amp;", "&");
  }

  const stamp = new Date().toISOString();
  cache[url] = { stamp, url, icon, type, title };
  return { url, icon, type, title };
}
