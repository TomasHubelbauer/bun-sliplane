import type { Errand } from "./Errand.ts";

export default function groupErrands(errands: Errand[]) {
  const ungrouped: Errand[] = [];
  const groups: {
    stamp: string;
    errands: Errand[];
  }[] = [];
  for (const errand of errands) {
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
}
