import type { ServerWebSocket } from "bun";
import compareLinks from "./compareLinks.ts";
import db from "./db.ts";
import v8 from "v8";
import fs from "fs";
import volumePath from "./volumePath.ts";

// Do link monitoring so that overlapping timers due to restart don't interfere
const monitorFrequency = 60_000;

export default async function monitorLinks() {
  if (
    !globalThis.isMonitoring &&
    (!globalThis.monitorStamp ||
      Date.now() - globalThis.monitorStamp > monitorFrequency)
  ) {
    globalThis.isMonitoring = true;

    const name = v8.writeHeapSnapshot();
    console.log(
      new Date().toISOString().slice("yyyy-mm-ddT".length, -".###Z".length),
      "Heap snapshot written to",
      name
    );

    // Copy from server disk to attached volume to survive restarts
    await fs.promises.copyFile(name, volumePath + "/" + name);

    console.log(
      new Date().toISOString().slice("yyyy-mm-ddT".length, -".###Z".length),
      "Monitoring links… Clients:",
      (globalThis.clients as ServerWebSocket<unknown>[])
        .map((c) => `${c.data} (${c.readyState})`)
        .join(", ") || "none"
    );

    const lastCheck = db
      .query(`SELECT stamp FROM audits WHERE name = 'link-check'`)
      .get() as { stamp: string };

    if (!lastCheck?.stamp) {
      await compareLinks(globalThis.clients as ServerWebSocket<unknown>[]);

      for (const client of globalThis.clients as ServerWebSocket<unknown>[]) {
        if (client.readyState === 1) {
          client.send(
            JSON.stringify({
              type: "reportLinkCheckStatus",
              data: {
                lastCheckStamp: new Date().toISOString(),
                nextCheckStamp: new Date(
                  Date.now() + monitorFrequency
                ).toISOString(),
              },
            })
          );
        }
      }
    } else {
      const lastCheckStamp = new Date(lastCheck.stamp);
      const now = new Date();
      const difference = now.getTime() - lastCheckStamp.getTime();
      if (difference > monitorFrequency) {
        await compareLinks(globalThis.clients as ServerWebSocket<unknown>[]);
      }

      for (const client of globalThis.clients as ServerWebSocket<unknown>[]) {
        if (client.readyState === 1) {
          client.send(
            JSON.stringify({
              type: "reportLinkCheckStatus",
              data: {
                lastCheckStamp: lastCheck.stamp,
                nextCheckStamp: new Date(
                  lastCheckStamp.getTime() + monitorFrequency
                ).toISOString(),
              },
            })
          );
        }
      }
    }

    globalThis.monitorStamp = Date.now();
    globalThis.isMonitoring = false;
  }

  await Bun.sleep(1000);
  monitorLinks();
}
