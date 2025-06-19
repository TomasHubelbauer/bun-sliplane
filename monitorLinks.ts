import type { ServerWebSocket } from "bun";
import compareLinks from "./compareLinks.ts";
import db from "./db.ts";

// Do link monitoring so that overlapping timers due to restart don't interfere
const monitorFrequency = 60_000;

export default async function monitorLinks() {
  if (
    !globalThis.isMonitoring &&
    (!globalThis.monitorStamp ||
      Date.now() - globalThis.monitorStamp > monitorFrequency)
  ) {
    globalThis.isMonitoring = true;

    console.log(
      new Date().toISOString(),
      "Monitoring links… Clients:",
      (globalThis.clients as ServerWebSocket<unknown>[])
        .map((c) => c.data)
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
