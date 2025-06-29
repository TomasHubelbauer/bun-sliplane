import type { Errand } from "./Errand.ts";
import TaskErrand from "./TaskErrand.tsx";
import EventErrand from "./EventErrand.tsx";
import ReminderErrand from "./ReminderErrand.tsx";
import { useCallback, useMemo } from "react";
import { send } from "./webSocket.ts";

type ErrandProps = {
  errand: Errand;
};

export default function Errand({ errand }: ErrandProps) {
  const child = useMemo(() => {
    const type = errand.type;
    switch (type) {
      case "task": {
        return <TaskErrand {...errand} />;
      }
      case "event": {
        return <EventErrand {...errand} />;
      }
      case "reminder": {
        return <ReminderErrand {...errand} />;
      }
      default: {
        throw new Error(`Unknown errand type: ${type}`);
      }
    }
  }, [errand]);

  const handleDeleteButtonClick = useCallback(async () => {
    if (!confirm(`Delete "${errand.name}" (${errand.type})?`)) {
      return;
    }

    send({ type: "deleteErrand", rowId: errand.rowid });
  }, [errand]);

  return (
    <div className={Errand.name}>
      {child}
      <button
        onClick={handleDeleteButtonClick}
        title={`Delete "${errand.name}"`}
      >
        Delete
      </button>
    </div>
  );
}
