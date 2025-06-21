import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { listen, send } from "./webSocket.ts";
import MaskTweaker from "./MaskTweaker.tsx";
import LinkSnippet from "./LinkSnippet.tsx";
import type { Link } from "./Link.ts";

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

  const handleLinkSnippetSelect = useCallback((link: Link) => {
    setSelectedLink(link);
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
      {links.map((link, index) =>
        selectedLink?.rowid === link.rowid ? (
          <div key={index}>
            <LinkSnippet link={link} onSelect={handleLinkSnippetSelect} />
            <MaskTweaker
              rowId={selectedLink.rowid}
              onSave={handleMaskTweakerSave}
              onClose={handleMaskTweakerClose}
            />
          </div>
        ) : (
          <LinkSnippet
            key={index}
            link={link}
            onSelect={handleLinkSnippetSelect}
          />
        )
      )}
    </div>
  );
}
