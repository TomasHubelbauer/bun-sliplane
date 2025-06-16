import Item from "./Item.tsx";
import type { Item as ItemType } from "./ItemType.ts";
import type { WebSocketProps } from "./WebSocketProps.ts";

type ListProps = WebSocketProps & {
  items: ItemType[];
};

export default function List({ send, listen, items }: ListProps) {
  return (
    <div className={List.name}>
      {items.map((item) => (
        <Item key={item.rowid} send={send} listen={listen} {...item} />
      ))}
    </div>
  );
}
