import {
  useMemo,
  useCallback,
  type MouseEvent,
  useEffect,
  useState,
} from "react";
import { listen, send } from "./webSocket.ts";

type LinkPreviewProps = {
  url: string;
};

type Metadata = {
  url: string;
  icon: string;
  type: string;
  title: string;
};

export default function LinkPreview({ url }: LinkPreviewProps) {
  const { href, host, origin } = useMemo(() => new URL(url), [url]);
  const [metadata, setMetadata] = useState<Metadata>();

  const handleAClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    listen(abortController.signal, {
      fetchUrlMetadata: (data) => {
        if (data.url === url) {
          setMetadata(data);
        }
      },
    });

    send({ type: "fetchUrlMetadata", url });
    return () => {
      abortController.abort();
    };
  }, [url]);

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
