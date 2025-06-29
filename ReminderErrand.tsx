import type { ReminderErrand } from "./Errand.ts";

export default function ReminderErrand({ name }: ReminderErrand) {
  return <div className={ReminderErrand.name}>🔔 {name}</div>;
}
