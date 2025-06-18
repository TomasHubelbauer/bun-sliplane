import Item from "./Item.tsx";
import type { Item as ItemType } from "./ItemType.ts";

type ListProps = {
  items: ItemType[];
};

export default function List({ items }: ListProps) {
  return (
    <div className={List.name}>
      {items.map((item) => (
        <Item key={item.rowid} {...item} />
      ))}
    </div>
  );
}
