import { useCallback, useEffect, useState, type KeyboardEvent } from "react";
import type { Item as ItemType } from "./ItemType.ts";
import Item from "./Item.tsx";

export default function App() {
  const [password, setPassword] = useState<string | null>(
    localStorage.getItem("password")
  );

  const [draft, setDraft] = useState<string>("");
  const [items, setItems] = useState<ItemType[]>([]);

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
        {password &&
          items.map((item) => (
            <Item
              key={item.stamp}
              {...item}
              password={password}
              onDelete={refreshItems}
              onRename={refreshItems}
            />
          ))}
      </ul>
    </>
  );
}
