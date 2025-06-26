import type { EventErrand } from "./Errand.ts";

export default function EventErrand({ name }: EventErrand) {
  return <div className={EventErrand.name}>🗓️ {name}</div>;
}
