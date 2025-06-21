import { useCallback, type MouseEvent } from "react";
import Stamp from "./Stamp.tsx";
import LinkPreview from "./LinkPreview.tsx";
import type { Link } from "./Link.ts";
import { send } from "./webSocket.ts";

type LinkSnippetProps = {
  link: Link;
  onSelect: (link: Link) => void;
};

export default function LinkSnippet({ link, onSelect }: LinkSnippetProps) {
  const handleMaskCodeClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      onSelect(link);
    },
    [onSelect]
  );

  const handleForceCheckButtonClick = useCallback(
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

  return (
    <div className={LinkSnippet.name}>
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
        {link.mask.length > 25 ? `${link.mask.slice(0, 25)}…` : link.mask}
      </code>
      <button data-url={link.url} onClick={handleForceCheckButtonClick}>
        Force check
      </button>
      <button data-url={link.url} onClick={handleDeleteButtonClick}>
        Delete
      </button>
    </div>
  );
}
