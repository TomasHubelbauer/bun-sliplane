import Item from "./Item.tsx";
import type { Item as ItemType } from "./ItemType.ts";

type ListProps = {
  ws: WebSocket;
  items: ItemType[];
};

export default function List({ ws, items }: ListProps) {
  return (
    <div className="list">
      {items.map((item) => (
        <Item key={item.rowid} ws={ws} {...item} />
      ))}
    </div>
  );
}
