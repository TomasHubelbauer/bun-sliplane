import { useCallback, useMemo, useRef, type ChangeEvent } from "react";
import type { Item as ItemType } from "./ItemType.ts";
import RichText from "./RichText.tsx";
import segmentUrls from "./segmentUrls.ts";

type ItemProps = ItemType & {
  password: string;
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
  password,
  onDelete,
  onRename,
  onAttach,
}: ItemProps) {
  const handleDeleteButtonClick = useCallback(async () => {
    if (!confirm(`Delete item "${name}"?`)) {
      return;
    }

    await fetch(`/${password}?rowId=${rowid}`, { method: "DELETE" });
    await onDelete();
  }, [password, onDelete, rowid, name]);

  const handleNameSpanClick = useCallback(async () => {
    const newName = prompt("Name:", name);
    if (!newName || newName === name) {
      return;
    }

    await fetch(`/${password}?rowId=${rowid}`, {
      method: "PUT",
      body: JSON.stringify({ name: newName }),
    });

    await onRename();
  }, [password, onRename, rowid, name]);

  const handleTextSpanClick = useCallback(async () => {
    const newText = prompt("Text:", text);
    if (!newText || newText === text) {
      return;
    }

    await fetch(`/${password}?rowId=${rowid}`, {
      method: "PUT",
      body: JSON.stringify({ text: newText }),
    });

    await onRename();
  }, [password, onRename, rowid, text]);

  const nameSegments = useMemo(() => [...segmentUrls(name)], [name]);
  const textSegments = useMemo(() => [...segmentUrls(text)], [text]);

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
        await fetch(`/${password}/attach?rowId=${rowid}`, {
          method: "POST",
          body: formData,
        });
      }

      await onAttach();
    },
    [password, onAttach]
  );

  const files: { uuid: string; name: string; type: string }[] = useMemo(
    () =>
      JSON.parse(attachments || "[]").map((attachment) =>
        JSON.parse(attachment)
      ),
    [attachments]
  );

  return (
    <fieldset className="item">
      <legend>
        <button onClick={handleDeleteButtonClick}>✕</button>
        <span
          onClick={handleNameSpanClick}
          className={name ? "" : "placeholder"}
        >
          <RichText parts={nameSegments} />
          {!name && "(unnamed)"}
        </span>
        <input type="file" ref={inputRef} onChange={handleInputChange} />
        <button onClick={handleAttachButtonClick}>+</button>
        {files.map((file) => (
          <a
            key={file.uuid}
            href={`/${password}/attach?rowId=${rowid}&uuid=${file.uuid}`}
            target="_blank"
          >
            {file.type.startsWith("image/") && "🖼️ "}
            {file.name}
          </a>
        ))}
      </legend>
      <span onClick={handleTextSpanClick}>
        <RichText parts={textSegments} />
      </span>
      <div className="metadata">
        <span className="placeholder">#{rowid}</span>
        <time dateTime={stamp} title={stamp}>
          {stamp}
        </time>
      </div>
    </fieldset>
  );
}
