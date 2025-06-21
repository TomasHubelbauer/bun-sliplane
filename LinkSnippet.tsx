import { useCallback, type MouseEvent } from "react";
import Stamp from "./Stamp.tsx";
import LinkPreview from "./LinkPreview.tsx";
import type { Link } from "./Link.ts";
import { send } from "./webSocket.ts";
import TrimmedText from "./TrimmedText.tsx";

type LinkSnippetProps = {
  link: Link;
  onSelect: (link: Link) => void;
};

export default function LinkSnippet({ link, onSelect }: LinkSnippetProps) {
  const handleMaskCodeClick = useCallback(() => onSelect(link), [onSelect]);

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

  const handleRunMaskPositiveCodeClick = useCallback(() => {
    const runMaskPositive = prompt(undefined, link.runMaskPositive);
    if (runMaskPositive === null) {
      return;
    }

    send({
      type: "setLinkRunMaskPositive",
      rowId: link.rowid,
      runMaskPositive,
    });
  }, []);

  const handleRunMaskNegativeCodeClick = useCallback(() => {
    const runMaskNegative = prompt(undefined, link.runMaskNegative);
    if (runMaskNegative === null) {
      return;
    }

    send({
      type: "setLinkRunMaskNegative",
      rowId: link.rowid,
      runMaskNegative,
    });
  }, []);

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
      · Diff mask:
      <code onClick={handleMaskCodeClick}>
        <TrimmedText text={link.mask} limit={25} />
      </code>
      · Run mask (positive):
      <code onClick={handleRunMaskPositiveCodeClick}>
        <TrimmedText text={link.runMaskPositive} limit={25} />
      </code>
      · Run mask (negative):
      <code onClick={handleRunMaskNegativeCodeClick}>
        <TrimmedText text={link.runMaskNegative} limit={25} />
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
