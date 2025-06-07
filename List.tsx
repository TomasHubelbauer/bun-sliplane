import Item from "./Item.tsx";
import type { Item as ItemType } from "./ItemType.ts";

type ListProps = {
  items: ItemType[];
  password: string;
  refreshItems: () => Promise<void>;
};

export default function List({ items, password, refreshItems }: ListProps) {
  return (
    <ul>
      {items.map((item) => (
        <Item
          key={item.stamp}
          {...item}
          password={password}
          onDelete={refreshItems}
          onRename={refreshItems}
        />
      ))}
    </ul>
  );
}
