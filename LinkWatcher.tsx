import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from "react";
import Stamp from "./Stamp.tsx";
import LinkPreview from "./LinkPreview.tsx";
import { listen, send } from "./webSocket.ts";
import MaskTweaker from "./MaskTweaker.tsx";

type Link = {
  rowid: number;
  url: string;
  checkStamp: string;
  changeStamp: string;
  mask: string;
};

export default function LinkWatcher() {
  const [draft, setDraft] = useState("");
  const [links, setLinks] = useState<Link[]>([]);
  const [selectedLink, setSelectedLink] = useState<Link>();

  useEffect(() => {
    const abortController = new AbortController();

    listen(abortController.signal, {
      listLinks: setLinks,
    });

    send({ type: "listLinks" });
    return () => {
      abortController.abort();
    };
  }, []);

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
    [draft]
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

  const handleMaskCodeClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const rowId = +event.currentTarget.dataset.rowid!;
      const link = links.find((link) => link.rowid === rowId);
      if (!link) {
        return;
      }

      setSelectedLink(link);
    },
    [links]
  );

  const handleMaskTweakerSave = useCallback(
    (rowId: number, mask: string) => {
      if (!selectedLink) {
        return;
      }

      send({
        type: "setLinkMask",
        rowId,
        mask,
      });
    },
    [selectedLink, send]
  );

  const handleMaskTweakerClose = useCallback(() => {
    setSelectedLink(undefined);
  }, []);

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
          <LinkPreview url={link.url} />·
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
          · Mask:
          <code data-rowid={link.rowid} onClick={handleMaskCodeClick}>
            {link.mask}
          </code>
          <button data-url={link.url} onClick={handleForceCheckOneButtonClick}>
            Force check
          </button>
          <button data-url={link.url} onClick={handleDeleteButtonClick}>
            Delete
          </button>
        </div>
      ))}
      {selectedLink && (
        <MaskTweaker
          rowId={selectedLink.rowid}
          onSave={handleMaskTweakerSave}
          onClose={handleMaskTweakerClose}
        />
      )}
      <button onClick={handleForceCheckButtonClick}>Force check all</button>
    </div>
  );
}
