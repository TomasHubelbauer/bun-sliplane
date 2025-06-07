import {
  useCallback,
  useEffect,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import type { Item } from "./Item.d.ts";

export default function App() {
  const [password, setPassword] = useState<string | null>(
    localStorage.getItem("password")
  );

  const [draft, setDraft] = useState<string>("");
  const [items, setItems] = useState<Item[]>([]);

  const refreshItems = useCallback(async () => {
    if (!password) {
      setItems([]);
      return;
    }

    const response = await fetch(`/${password}`);
    setItems(await response.json());
  }, [password]);

  useEffect(() => {
    void refreshItems();

    document.addEventListener("visibilitychange", refreshItems);
    return () => {
      document.removeEventListener("visibilitychange", refreshItems);
    };
  }, [refreshItems]);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setDraft(event.currentTarget.value);
    },
    []
  );

  const handleInputKeyDown = useCallback(
    async (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") {
        return;
      }

      const text = event.currentTarget.value.trim();
      if (!text) {
        return;
      }

      if (!password) {
        localStorage.setItem("password", text);
        setPassword(text);
        await refreshItems();
        return;
      }

      await fetch(`/${password}`, { method: "POST", body: text });
      setDraft("");
      await refreshItems();
    },
    [password, refreshItems]
  );

  const handleLogoutButtonClick = useCallback(async () => {
    if (!confirm("Are you sure you want to log out?")) {
      return;
    }

    localStorage.removeItem("password");
    setPassword(null);
    setItems([]);
    await refreshItems();
  }, [refreshItems]);

  const handleDeleteButtonClick = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      const stamp = event.currentTarget.dataset.stamp;
      if (!stamp) {
        return;
      }

      const item = items.find((item) => item.stamp === stamp);
      if (!item) {
        return;
      }

      if (!confirm(`Delete item "${item.name}"?`)) {
        return;
      }

      await fetch(`/${password}?stamp=${stamp}`, { method: "DELETE" });
      await refreshItems();
    },
    [items, password, refreshItems]
  );

  const handleTextSpanClick = useCallback(
    async (event: MouseEvent<HTMLSpanElement>) => {
      const stamp = event.currentTarget.dataset.stamp;
      if (!stamp) {
        return;
      }

      const item = items.find((item) => item.stamp === stamp);
      if (!item) {
        return;
      }

      const text = prompt("Text:", item.text);
      if (!text || text === item.text) {
        return;
      }

      await fetch(`/${password}?stamp=${stamp}`, {
        method: "PUT",
        body: text,
      });

      await refreshItems();
    },
    [items, password, refreshItems]
  );

  return (
    <>
      <div>
        <input
          autoComplete="off"
          autoFocus
          onKeyDown={handleInputKeyDown}
          placeholder={!password ? "Set password" : undefined}
          value={draft}
          onChange={handleInputChange}
        />
        <button onClick={handleLogoutButtonClick}>Log out</button>
      </div>
      <ul>
        {items.map((item) => (
          <li key={item.stamp}>
            <button data-stamp={item.stamp} onClick={handleDeleteButtonClick}>
              ✕
            </button>
            <time dateTime={item.stamp} title={item.stamp}>
              {item.name}:
            </time>
            <span data-stamp={item.stamp} onClick={handleTextSpanClick}>
              {item.text}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
