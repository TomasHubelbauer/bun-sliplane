import { useCallback, useEffect, useState } from "react";
import type { Item as ItemType } from "./ItemType.ts";
import Item from "./Item.tsx";
import Composer from "./Composer.tsx";

export default function App() {
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

  return (
    <>
      <div>
        <Composer
          password={password}
          setPassword={setPassword}
          onSubmit={refreshItems}
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
