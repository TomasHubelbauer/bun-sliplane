import {
  useCallback,
  useMemo,
  useRef,
  type ChangeEvent,
  type MouseEvent,
} from "react";
import type { Item as ItemType } from "./ItemType.ts";
import RichText from "./RichText.tsx";
import Stamp from "./Stamp.tsx";

type ItemProps = ItemType & {
  onDelete: () => Promise<void>;
  onRename: () => Promise<void>;
  onAttach: () => Promise<void>;
};

export default function Item({
  rowid,
  stamp,
  name,
  text,
  attachments,
  onDelete,
  onRename,
  onAttach,
}: ItemProps) {
  const handleDeleteButtonClick = useCallback(async () => {
    if (!confirm(`Delete item "${name}"?`)) {
      return;
    }

    await fetch(`/items?rowId=${rowid}`, { method: "DELETE" });
    await onDelete();
  }, [onDelete, rowid, name]);

  const handleNameSpanClick = useCallback(async () => {
    const newName = prompt("Name:", name);
    if (!newName || newName === name) {
      return;
    }

    await fetch(`/items?rowId=${rowid}`, {
      method: "PUT",
      body: JSON.stringify({ name: newName }),
    });

    await onRename();
  }, [onRename, rowid, name]);

  const handleTextSpanClick = useCallback(async () => {
    const newText = prompt("Text:", text);
    if (!newText || newText === text) {
      return;
    }

    await fetch(`/items?rowId=${rowid}`, {
      method: "PUT",
      body: JSON.stringify({ text: newText }),
    });

    await onRename();
  }, [onRename, rowid, text]);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleAttachButtonClick = useCallback(
    () => inputRef.current?.click(),
    []
  );

  const handleInputChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      if (!event.currentTarget.files?.length) {
        return;
      }

      for (const file of event.currentTarget.files) {
        const formData = new FormData();
        formData.append("file", file);
        await fetch(`/attach?rowId=${rowid}`, {
          method: "POST",
          body: formData,
        });
      }

      await onAttach();
    },
    [onAttach, rowid]
  );

  const files: { uuid: string; name: string; type: string }[] = useMemo(
    () =>
      JSON.parse(attachments || "[]").map((attachment) =>
        JSON.parse(attachment)
      ),
    [attachments]
  );

  const handleDeleteAttachmentButtonClick = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      const button = event.currentTarget;
      const uuid = button.dataset.uuid;
      if (!uuid) {
        return;
      }

      const attachment = files.find((file) => file.uuid === uuid);
      if (!attachment) {
        return;
      }

      if (!confirm(`Delete attachment "${attachment.name}"?`)) {
        return;
      }

      await fetch(`/attach?rowId=${rowid}&uuid=${uuid}`, {
        method: "DELETE",
      });

      await onAttach();
    },
    [onAttach, rowid, files]
  );

  return (
    <fieldset className="item">
      <legend>
        <button onClick={handleDeleteButtonClick}>✕</button>
        <span
          onClick={handleNameSpanClick}
          className={name ? "" : "placeholder"}
        >
          <RichText text={name} />
          {!name && "(unnamed)"}
        </span>
        <input type="file" ref={inputRef} onChange={handleInputChange} />
        <button onClick={handleAttachButtonClick}>+</button>
        {files.map((file) => (
          <span key={file.uuid} className="attachment">
            {file.type.startsWith("image/") && <span>🖼️</span>}
            <a
              href={`/attach?rowId=${rowid}&uuid=${file.uuid}`}
              target="_blank"
            >
              {file.name}
            </a>
            <button
              onClick={handleDeleteAttachmentButtonClick}
              data-uuid={file.uuid}
            >
              ✕
            </button>
          </span>
        ))}
      </legend>
      <span onClick={handleTextSpanClick}>
        <RichText text={text} />
      </span>
      <div className="metadata">
        <span className="placeholder">#{rowid}</span>
        <Stamp stamp={stamp} />
      </div>
    </fieldset>
  );
}
