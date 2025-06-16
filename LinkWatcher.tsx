import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from "react";
import Stamp from "./Stamp.tsx";
import LinkPreview from "./LinkPreview.tsx";
import type { WebSocketProps } from "./WebSocketProps.ts";

type LinkWatcherProps = WebSocketProps;

type Link = {
  url: string;
  checkStamp: string;
  changeStamp: string;
};

export default function LinkWatcher({ send, listen }: LinkWatcherProps) {
  const [draft, setDraft] = useState("");
  const [links, setLinks] = useState<Link[]>([]);
  const [logs, setLogs] = useState(localStorage.getItem("linkCheckLog") || "");

  useEffect(() => {
    const abortController = new AbortController();

    listen(abortController.signal, {
      listLinks: (data: Link[]) => {
        setLinks(data);
      },
      reportLinkCheckLog: (data: string) => {
        setLogs(
          (logs) =>
            `${new Date().toISOString()}: ${data}` +
            logs.split("\n").slice(0, 100).join("\n")
        );
      },
    });

    send({ type: "listLinks" });
    return () => {
      abortController.abort();
    };
  }, [send, listen]);

  const handleDraftInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setDraft(event.target.value);
    },
    []
  );

  const handleDraftInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && draft) {
        send({ type: "trackLink", url: draft });
        setDraft("");
      }
    },
    [send, draft]
  );

  const handleDeleteButtonClick = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      const url = event.currentTarget.dataset.url;
      if (!url) {
        return;
      }

      if (!confirm(`Are you sure you want to delete "${url}"?`)) {
        return;
      }

      send({
        type: "deleteLink",
        url,
      });
    },
    [send]
  );

  const handleForceCheckButtonClick = useCallback(() => {
    if (!confirm("Are you sure you want to force check all links?")) {
      return;
    }

    send({ type: "forceCheckLinks" });
  }, [send]);

  const handleForceCheckOneButtonClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const url = event.currentTarget.dataset.url;
      if (!url) {
        return;
      }

      send({
        type: "forceCheckLink",
        url,
      });
    },
    [send]
  );

  return (
    <div className={LinkWatcher.name}>
      <input
        value={draft}
        onChange={handleDraftInputChange}
        onKeyDown={handleDraftInputKeyDown}
        pattern="https?://.+"
        placeholder="https?://.*"
      />
      {links.map((link, index) => (
        <div key={index}>
          <LinkPreview send={send} listen={listen} url={link.url} />·
          <div>
            Last checked: <Stamp stamp={link.checkStamp} />
          </div>
          ·
          <div>
            Last changed: <Stamp stamp={link.changeStamp} />
          </div>
          ·
          <a href={`/preview/` + link.url} target="_blank">
            Preview
          </a>
          <button data-url={link.url} onClick={handleForceCheckOneButtonClick}>
            Force check
          </button>
          <button data-url={link.url} onClick={handleDeleteButtonClick}>
            Delete
          </button>
        </div>
      ))}
      <textarea readOnly value={logs} rows={5} />
      <button onClick={handleForceCheckButtonClick}>Force check all</button>
    </div>
  );
}
