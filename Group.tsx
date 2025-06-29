import { useCallback, useMemo } from "react";
import type { Errand as ErrandType } from "./Errand.ts";
import Errand from "./Errand.tsx";
import { send } from "./webSocket.ts";
import Stamp from "./Stamp.tsx";

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

  const isToday = useMemo(() => {
    const todayStamp = new Date().toISOString().slice(0, "yyyy-mm-dd".length);
    return stamp === todayStamp;
  }, [stamp]);

  const isTomorrow = useMemo(() => {
    const tomorrowStamp = new Date();
    tomorrowStamp.setDate(tomorrowStamp.getDate() + 1);
    return stamp === tomorrowStamp.toISOString().slice(0, "yyyy-mm-dd".length);
  }, [stamp]);

  return (
    <div className={Group.name}>
      <div>
        <span className="stamp">{stamp}</span>
        <span className={isWeekendDay ? "weekendDay" : "weekDay"}>
          {dayName}
        </span>
        ·{isToday && <span className="today">Today</span>}
        {isTomorrow && <span className="tomorrow">Tomorrow</span>}
        {!isToday && !isTomorrow && <Stamp stamp={stamp} />}
        <button onClick={handleAddEventButtonClick}>Add event</button>
      </div>
      {errands.map((errand) => (
        <Errand key={errand.rowid} errand={errand} />
      ))}
    </div>
  );
}
