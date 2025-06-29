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

  const isWeekendDay = useMemo(() => {
    const date = new Date(stamp);
    const day = date.getDay();
    return day === 0 || day === 6;
  }, [stamp]);

  return (
    <div className={Group.name}>
      <div>
        {stamp}
        <span className={isWeekendDay ? "weekendDay" : "weekDay"}>
          {dayName}
        </span>
        <button onClick={handleAddEventButtonClick}>Add event</button>
      </div>
      {errands.map((errand) => (
        <Errand key={errand.rowid} errand={errand} />
      ))}
    </div>
  );
}
