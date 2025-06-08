import { useCallback } from "react";
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
  const handleDeleteButtonClick = useCallback(async () => {
    if (!confirm(`Delete item "${name}"?`)) {
      return;
    }

    await fetch(`/${password}?stamp=${stamp}`, { method: "DELETE" });
    await onDelete();
  }, [password, onDelete, stamp, name]);

  const handleNameSpanClick = useCallback(async () => {
    const newName = prompt("Name:", name);
    if (!newName || newName === name) {
      return;
    }

    await fetch(`/${password}?stamp=${stamp}`, {
      method: "PUT",
      body: JSON.stringify({ name: newName }),
    });

    await onRename();
  }, [password, onRename, stamp, name]);

  const handleTextSpanClick = useCallback(async () => {
    const newText = prompt("Text:", text);
    if (!newText || newText === text) {
      return;
    }

    await fetch(`/${password}?stamp=${stamp}`, {
      method: "PUT",
      body: JSON.stringify({ text: newText }),
    });

    await onRename();
  }, [password, onRename, stamp, text]);

  return (
    <li>
      <button onClick={handleDeleteButtonClick}>✕</button>
      <time dateTime={stamp} title={stamp} onClick={handleNameSpanClick}>
        {name}
      </time>
      <span onClick={handleTextSpanClick}>{text}</span>
    </li>
  );
}
