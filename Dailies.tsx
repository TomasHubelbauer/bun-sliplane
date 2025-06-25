import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from "react";
import { listen, send } from "./webSocket.ts";
import type { Daily } from "./Daily.ts";
import Stamp from "./Stamp.tsx";

export default function Dailies() {
  const [dailies, setDailies] = useState<Daily[]>([]);

  useEffect(() => {
    const abortController = new AbortController();

    listen(abortController.signal, {
      getDailies: setDailies,
    });

    send({ type: "getDailies" });
    return () => {
      abortController.abort();
    };
  }, []);

  const handleButtonClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const rowId = +event.currentTarget.dataset.rowid!;
      const daily = dailies.find((daily) => daily.rowid === rowId);
      if (!daily) {
        return;
      }

      send({
        type: "setDailyStamp",
        rowId: daily.rowid,
      });
    },
    [dailies]
  );

  const handleNewButtonClick = useCallback(() => {
    const name = prompt("Name:");
    if (!name) {
      return;
    }

    const note = prompt("Note:");
    if (note === null) {
      return;
    }

    const icon = prompt("Icon:");
    if (!icon) {
      return;
    }

    send({ type: "createDaily", name, note, icon });
  }, []);

  const stamp = useMemo(
    () => new Date().toISOString().slice(0, "yyyy-mm-dd".length),
    []
  );

  const todoDailies = useMemo(
    () => dailies.filter((daily) => !daily.stamp?.startsWith(stamp)),
    [dailies, stamp]
  );

  const doneDailies = useMemo(
    () => dailies.filter((daily) => daily.stamp?.startsWith(stamp)),
    [dailies, stamp]
  );

  return (
    <div className={Dailies.name}>
      {todoDailies.map((daily) => (
        <button
          key={daily.rowid}
          data-rowid={daily.rowid}
          title={daily.name + (daily.note ? "\n" + daily.note : "")}
          onClick={handleButtonClick}
        >
          {daily.icon}
          {daily.stamp && " "}
          {daily.stamp && (
            <Stamp stamp={daily.stamp} showWord={false} shortUnit />
          )}
        </button>
      ))}
      {todoDailies.length > 0 && "·"}
      {doneDailies.map((daily) => (
        <button
          key={daily.rowid}
          data-rowid={daily.rowid}
          title={daily.name + (daily.note ? "\n" + daily.note : "")}
          disabled
        >
          {daily.icon}
          {daily.stamp && " "}
          {daily.stamp && (
            <Stamp stamp={daily.stamp} showWord={false} shortUnit />
          )}
        </button>
      ))}
      {doneDailies.length > 0 && "·"}
      <button onClick={handleNewButtonClick}>+</button>
    </div>
  );
}
