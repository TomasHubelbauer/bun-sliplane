import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from "react";
import Stamp from "./Stamp.tsx";
import LinkPreview from "./LinkPreview.tsx";

type LinkWatcherProps = {
  ws: WebSocket;
};

type Link = {
  url: string;
  checkStamp: string;
  changeStamp: string;
};

export default function LinkWatcher({ ws }: LinkWatcherProps) {
  const [draft, setDraft] = useState("");
  const [links, setLinks] = useState<Link[]>([]);
  const [logs, setLogs] = useState(localStorage.getItem("linkCheckLog") || "");

  useEffect(() => {
    const abortController = new AbortController();
    ws.addEventListener(
      "message",
      (event) => {
        const { type, data } = JSON.parse(event.data);
        switch (type) {
          case "listLinks": {
            setLinks(data);
            break;
          }
          case "reportLinkCheckLog": {
            setLogs(
              (logs) =>
                `${new Date().toISOString()}: ${data}` +
                logs.split("\n").slice(0, 100).join("\n")
            );

            break;
          }
        }
      },
      { signal: abortController.signal }
    );

    ws.send(JSON.stringify({ type: "listLinks" }));
    return () => {
      abortController.abort();
    };
  }, [ws]);

  const handleDraftInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setDraft(event.target.value);
    },
    [ws]
  );

  const handleDraftInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && draft) {
        ws.send(JSON.stringify({ type: "trackLink", url: draft }));
        setDraft("");
      }
    },
    [ws, draft]
  );

  const handleDeleteButtonClick = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      const url = event.currentTarget.dataset.url;
      if (!confirm(`Are you sure you want to delete "${url}"?`)) {
        return;
      }

      ws.send(
        JSON.stringify({
          type: "deleteLink",
          url,
        })
      );
    },
    [ws]
  );

  const handleForceCheckButtonClick = useCallback(() => {
    if (!confirm("Are you sure you want to force check all links?")) {
      return;
    }

    ws.send(JSON.stringify({ type: "forceCheckLinks" }));
  }, [ws]);

  const handleForceCheckOneButtonClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const url = event.currentTarget.dataset.url;
      ws.send(
        JSON.stringify({
          type: "forceCheckLink",
          url,
        })
      );
    },
    [ws]
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
          <LinkPreview ws={ws} url={link.url} />·
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
