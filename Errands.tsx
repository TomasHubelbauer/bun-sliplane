import { useCallback, useEffect, useMemo, useState } from "react";
import { listen, send } from "./webSocket.ts";
import type { RawErrand, Errand as ErrandType } from "./Errand.ts";
import Group from "./Group.tsx";
import Errand from "./Errand.tsx";

export default function Errands() {
  const [errands, setErrands] = useState<RawErrand[]>([]);

  const parsedErrands: ErrandType[] = useMemo(
    () =>
      errands.map((errand) => {
        switch (errand.type) {
          case "task": {
            return {
              rowid: errand.rowid,
              name: errand.name,
              type: "task",
            };
          }
          case "event": {
            const data = JSON.parse(errand.data);
            return {
              rowid: errand.rowid,
              name: errand.name,
              type: "event",
              stamp: data.stamp,
            };
          }
          default: {
            throw new Error(`Unknown errand type: ${errand.type}`);
          }
        }
      }),
    [errands]
  );

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

  const { ungrouped, groups } = useMemo(() => {
    const ungrouped: (typeof parsedErrands)[number][] = [];
    const groups: {
      stamp: string;
      errands: (typeof parsedErrands)[number][];
    }[] = [];
    for (const errand of parsedErrands) {
      const type = errand.type;
      switch (type) {
        case "task": {
          ungrouped.push(errand);
          break;
        }
        case "event": {
          const stamp = errand.stamp;
          let group = groups.find((group) => group.stamp === stamp);
          if (!group) {
            group = { stamp, errands: [] };
            groups.push(group);
          }

          group.errands.push(errand);
          break;
        }
        default: {
          throw new Error(`Unknown errand type: ${type}`);
        }
      }
    }

    return { ungrouped, groups };
  }, [parsedErrands]);

  const handleAddTaskButtonClick = useCallback(() => {
    const name = prompt("Name:");
    if (!name) {
      return;
    }

    send({ type: "createTaskErrand", name });
  }, []);

  const handleAddEventButtonClick = useCallback(() => {
    const name = prompt("Name:");
    if (!name) {
      return;
    }

    const stamp = prompt("Stamp (YYYY-MM-DD):");
    if (!stamp) {
      return;
    }

    send({ type: "createEventErrand", name, stamp });
  }, []);

  return (
    <div className={Errands.name}>
      <div>
        <button onClick={handleAddTaskButtonClick}>Add task</button>
        <button onClick={handleAddEventButtonClick}>Add event</button>
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
