import { useCallback, useEffect, useMemo, useState } from "react";
import type { Item as ItemType } from "./ItemType.ts";
import Composer from "./Composer.tsx";
import List from "./List.tsx";

export default function App() {
  const [draft, setDraft] = useState<string>("");
  const [password, setPassword] = useState<string | null>(
    localStorage.getItem("password")
  );

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

  const handleLogoutButtonClick = useCallback(async () => {
    if (!confirm("Are you sure you want to log out?")) {
      return;
    }

    localStorage.removeItem("password");
    setPassword(null);
    setItems([]);
    await refreshItems();
  }, [refreshItems]);

  const search = useMemo(() => {
    const search = draft.trim().toUpperCase();
    if (!search || search.includes(" ")) {
      return;
    }

    return search;
  }, [draft]);

  const matches = useMemo(() => {
    return search
      ? items.filter((item) => item.text.toUpperCase().includes(search))
      : [];
  }, [items, search]);

  return (
    <>
      <div className="composer">
        <Composer
          draft={draft}
          setDraft={setDraft}
          password={password}
          setPassword={setPassword}
          onSubmit={refreshItems}
        />
        <button onClick={handleLogoutButtonClick}>Log out</button>
      </div>
      {matches.length > 0 && `Items matching "${search}":`}
      {password && (
        <List
          items={matches.length ? matches : items}
          password={password}
          refreshItems={refreshItems}
        />
      )}
    </>
  );
}
