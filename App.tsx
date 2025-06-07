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
      const name = event.currentTarget.dataset.name;
      if (!name) {
        return;
      }

      if (!confirm(`Delete item "${name}"?`)) {
        return;
      }

      await fetch(`/${password}?name=${name}`, { method: "DELETE" });
      await refreshItems();
    },
    [password, refreshItems]
  );

  const handleTextSpanClick = useCallback(
    async (event: MouseEvent<HTMLSpanElement>) => {
      const name = event.currentTarget.dataset.name;
      if (!name) {
        return;
      }

      const item = items.find((item) => item.name === name);
      if (!item) {
        return;
      }

      const text = prompt("Text:", item.text);
      if (!text || text === item.text) {
        return;
      }

      await fetch(`/${password}?name=${name}`, {
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
          <li key={item.name}>
            <button data-name={item.name} onClick={handleDeleteButtonClick}>
              ✕
            </button>
            <time dateTime={item.name} title={item.name}>
              {item.name.slice(0, -"Z.json".length).replace("T", " ")}:{" "}
            </time>
            <span data-name={item.name} onClick={handleTextSpanClick}>
              {item.text}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
