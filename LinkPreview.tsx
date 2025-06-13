import {
  useMemo,
  useCallback,
  type MouseEvent,
  useEffect,
  useState,
} from "react";

type LinkPreviewProps = {
  ws: WebSocket;
  url: string;
};

type Metadata = {
  url: string;
  icon: string;
  type: string;
  title: string;
};

export default function LinkPreview({ ws, url }: LinkPreviewProps) {
  const { href, host, origin } = useMemo(() => new URL(url), [url]);
  const [metadata, setMetadata] = useState<Metadata>();

  const handleAClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    ws.addEventListener(
      "message",
      (event) => {
        const { type, data } = JSON.parse(event.data);
        if (type === "fetchUrlMetadata" && data.url === url) {
          setMetadata(data);
        }
      },
      { signal: abortController.signal }
    );

    ws.send(JSON.stringify({ type: "fetchUrlMetadata", url }));
    return () => {
      abortController.abort();
    };
  }, [ws, url]);

  useEffect(() => {
    setMetadata(undefined);
  }, [url]);

  return (
    <a
      href={href}
      target="_blank"
      onClick={handleAClick}
      title={metadata?.title ? `${href} "${metadata.title}"` : href}
      className={LinkPreview.name}
    >
      {metadata?.icon && (
        <img src={`data:${metadata.type};base64,${metadata.icon}`} alt="" />
      )}
      {host.slice(host.startsWith("www.") ? "www.".length : undefined)}
      {href.slice(origin.length, href.endsWith("/") ? -1 : undefined)}
      {metadata?.title && <q>{metadata.title}</q>}
    </a>
  );
}
