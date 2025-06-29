import { useCallback, useEffect, useMemo, useState } from "react";
import { listen, send } from "./webSocket.ts";
import type { RawErrand } from "./Errand.ts";
import Group from "./Group.tsx";
import Errand from "./Errand.tsx";
import groupErrands from "./groupErrands.ts";
import parseErrands from "./parseErrands.ts";

export default function Errands() {
  const [errands, setErrands] = useState<RawErrand[]>([]);

  const parsedErrands = useMemo(() => [...parseErrands(errands)], [errands]);

  useEffect(() => {
    const abortController = new AbortController();

    listen(abortController.signal, {
      getErrands: setErrands,
    });

    send({ type: "getErrands" });

    return () => {
      abortController.abort();
    };
  }, []);

  const { ungrouped, groups } = useMemo(
    () => groupErrands(parsedErrands),
    [parsedErrands]
  );

  const handleAddTaskButtonClick = useCallback(() => {
    const name = prompt("Name:");
    if (!name) {
      return;
    }

    send({ type: "createTaskErrand", name });
  }, []);

  const handleAddEventButtonClick = useCallback(() => {
    let name = prompt("Name:");
    if (!name) {
      return;
    }

    let stamp: string | null;
    if (name.match(/^\d{4}-\d{2}-\d{2} /)) {
      stamp = name.slice(0, "yyyy-mm-dd".length);
      name = name.slice("yyyy-mm-dd ".length).trim();
    } else {
      stamp = prompt("Stamp (YYYY-MM-DD):");
    }

    if (!stamp) {
      return;
    }

    send({ type: "createEventErrand", name, stamp });
  }, []);

  const handleAddReminderButtonClick = useCallback(() => {
    const name = prompt("Name:");
    if (!name) {
      return;
    }

    const dayOfMonth = prompt("Day of month:");
    if (!dayOfMonth) {
      return;
    }

    send({ type: "createReminderErrand", name, dayOfMonth: +dayOfMonth });
  }, []);

  return (
    <div className={Errands.name}>
      <div>
        <button onClick={handleAddTaskButtonClick}>Add task</button>
        <button onClick={handleAddEventButtonClick}>Add event</button>
        <button onClick={handleAddReminderButtonClick}>Add reminder</button>
      </div>
      {ungrouped.map((errand) => (
        <Errand key={errand.rowid} errand={errand} />
      ))}
      {groups.map((group) => (
        <Group key={group.stamp} stamp={group.stamp} errands={group.errands} />
      ))}
    </div>
  );
}
