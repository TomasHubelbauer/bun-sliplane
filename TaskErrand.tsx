import type { TaskErrand } from "./Errand.ts";

// TODO: Implement support for the follow-up tasks
export default function TaskErrand({ name }: TaskErrand) {
  return (
    <div className={TaskErrand.name}>
      ✅ {name}
      <button disabled>Add follow-up task</button>
    </div>
  );
}
