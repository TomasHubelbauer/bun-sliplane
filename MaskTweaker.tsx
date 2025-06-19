import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { listen, send } from "./webSocket.ts";

type Link = {
  rowid: number;
  url: string;
  checkStamp: string;
  changeStamp: string;
  mask: string;
  html: string;
};

type MaskTweakerProps = {
  rowId: number;
  onSave: (rowId: number, mask: string) => void;
  onClose: () => void;
};

export default function MaskTweaker({
  rowId,
  onSave,
  onClose,
}: MaskTweakerProps) {
  const [link, setLink] = useState<Link>();

  useEffect(() => {
    const abortController = new AbortController();

    listen(abortController.signal, {
      fetchLinkDetail: setLink,
    });

    send({ type: "fetchLinkDetail", rowId });
    return () => {
      abortController.abort();
    };
  }, [rowId]);

  const handleMaskInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setLink((link) =>
        link ? { ...link, mask: event.target.value } : undefined
      );
    },
    []
  );

  const handleSaveButtonClick = useCallback(() => {
    if (!link) {
      return;
    }

    onSave(rowId, link.mask);
    onClose();
  }, [rowId, link, onSave, onClose]);

  const [maskedHtml, error] = useMemo(() => {
    if (!link) {
      return ["", null];
    }

    if (!link.mask) {
      return [link.html, null];
    }

    try {
      const maskedHtml = link.html
        .replace(new RegExp(link.mask, "g"), (match) =>
          `█`.repeat(match.length)
        )
        .split("\n")
        .map((line) => `${line.includes("█") ? "█" : " "} ${line}`)
        .join("\n");

      return [maskedHtml, null];
    } catch (error) {
      return [link.html, error];
    }
  }, [link]);

  const handleMaskInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleSaveButtonClick();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    },
    [handleSaveButtonClick]
  );

  return (
    link && (
      <div className={MaskTweaker.name}>
        <input
          value={link.mask}
          onChange={handleMaskInputChange}
          onKeyDown={handleMaskInputKeyDown}
        />
        {error && <div className="error">Error: {error.message}</div>}
        <div className="split">
          <textarea value={maskedHtml} readOnly rows={30} onChange={() => {}} />
          <iframe
            src={`data:text/html;charset=utf-8,${encodeURIComponent(
              maskedHtml
            )}`}
          />
        </div>
        <button onClick={handleSaveButtonClick} disabled={!!error}>
          Save
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    )
  );
}
