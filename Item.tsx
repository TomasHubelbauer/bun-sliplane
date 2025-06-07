import { useCallback, type MouseEvent } from "react";
import type { Item as ItemType } from "./ItemType.ts";

type ItemProps = ItemType & {
  password: string;
  onDelete: () => Promise<void>;
  onRename: () => Promise<void>;
};

export default function Item({
  stamp,
  name,
  text,
  password,
  onDelete,
  onRename,
}: ItemProps) {
  const handleDeleteButtonClick = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      if (!confirm(`Delete item "${name}"?`)) {
        return;
      }

      await fetch(`/${password}?stamp=${stamp}`, { method: "DELETE" });
      await onDelete();
    },
    [password, onDelete, stamp, name]
  );

  const handleTextSpanClick = useCallback(
    async (event: MouseEvent<HTMLSpanElement>) => {
      const newText = prompt("Text:", text);
      if (!newText || newText === text) {
        return;
      }

      await fetch(`/${password}?stamp=${stamp}`, {
        method: "PUT",
        body: newText,
      });

      await onRename();
    },
    [password, onRename, stamp, text]
  );

  return (
    <li>
      <button onClick={handleDeleteButtonClick}>✕</button>
      <time dateTime={stamp} title={stamp}>
        {name}
      </time>
      <span onClick={handleTextSpanClick}>{text}</span>
    </li>
  );
}
