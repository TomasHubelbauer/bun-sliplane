import { useCallback, useMemo } from "react";
import type { Errand as ErrandType } from "./Errand.ts";
import Errand from "./Errand.tsx";
import { send } from "./webSocket.ts";

type GroupProps = {
  stamp: string;
  errands: ErrandType[];
};

export default function Group({ stamp, errands }: GroupProps) {
  const handleAddEventButtonClick = useCallback(() => {
    const name = prompt("Name:");
    if (!name) {
      return;
    }

    send({ type: "createEventErrand", name, stamp });
  }, [stamp]);

  const dayName = useMemo(
    () =>
      new Date(stamp).toLocaleDateString(undefined, {
        weekday: "long",
      }),
    [stamp]
  );

  return (
    <div className={Group.name}>
      <div>
        {stamp} {dayName}
        <button onClick={handleAddEventButtonClick}>Add event</button>
      </div>
      {errands.map((errand) => (
        <Errand key={errand.rowid} errand={errand} />
      ))}
    </div>
  );
}
