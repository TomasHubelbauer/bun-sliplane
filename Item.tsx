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
import { send } from "./webSocket.ts";

type ItemProps = ItemType;

export default function Item({
  rowid,
  stamp,
  name,
  text,
  attachments,
}: ItemProps) {
  const handleDeleteButtonClick = useCallback(async () => {
    if (!confirm(`Delete item "${name}"?`)) {
      return;
    }

    send({ type: "deleteItem", rowId: rowid });
  }, [rowid, name]);

  const handleNameRichTextChange = useCallback(
    async (value: string) => {
      send({
        type: "updateItem",
        rowId: rowid,
        name: value,
      });
    },
    [rowid]
  );

  const handleTextRichTextChange = useCallback(
    async (value: string) => {
      send({
        type: "updateItem",
        rowId: rowid,
        text: value,
      });
    },
    [rowid]
  );

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
        await fetch(`/attachment?rowId=${rowid}`, {
          method: "POST",
          body: formData,
        });
      }

      send({
        type: "getItems",
      });
    },
    [rowid]
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

      send({
        type: "deleteAttachment",
        rowId: rowid,
        uuid,
      });
    },
    [rowid, files]
  );

  return (
    <div className={Item.name}>
      <input type="file" ref={inputRef} onChange={handleInputChange} multiple />
      <div className="header">
        <span className="placeholder">#{rowid}</span>
        ·
        <RichText
          text={name}
          fallback={<span className="placeholder">(no name)</span>}
          onChange={handleNameRichTextChange}
        />
        ·
        <Stamp stamp={stamp} />
        <button onClick={handleAttachButtonClick}>+</button>
        <button onClick={handleDeleteButtonClick} title={`Delete "${name}"`}>
          ✕
        </button>
      </div>
      <RichText
        text={text}
        fallback={<span className="placeholder">(no text)</span>}
        onChange={handleTextRichTextChange}
        multiLine
      />
      {files.length > 0 &&
        files.map((file) => (
          <span key={file.uuid} className="attachment">
            {file.type.startsWith("image/") && <span>🖼️</span>}
            <a
              href={`/attachment?rowId=${rowid}&uuid=${file.uuid}`}
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
    </div>
  );
}
