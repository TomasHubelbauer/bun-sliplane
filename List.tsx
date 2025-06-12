import Item from "./Item.tsx";
import type { Item as ItemType } from "./ItemType.ts";

type ListProps = {
  items: ItemType[];
  refreshItems: () => Promise<void>;
};

export default function List({ items, refreshItems }: ListProps) {
  return (
    <div className="list">
      {items.map((item) => (
        <Item
          key={item.rowid}
          {...item}
          onDelete={refreshItems}
          onRename={refreshItems}
          onAttach={refreshItems}
        />
      ))}
    </div>
  );
}
