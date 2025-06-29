import type { RawErrand, TaskErrand, EventErrand } from "./Errand.ts";

export default function* parseErrands(errands: RawErrand[]) {
  for (const errand of errands) {
    switch (errand.type) {
      case "task": {
        yield {
          rowid: errand.rowid,
          name: errand.name,
          type: "task",
        } as TaskErrand;
      }
      case "event": {
        const data = JSON.parse(errand.data);
        yield {
          rowid: errand.rowid,
          name: errand.name,
          type: "event",
          stamp: data.stamp,
        } as EventErrand;
      }
      default: {
        throw new Error(`Unknown errand type: ${errand.type}`);
      }
    }
  }
}
