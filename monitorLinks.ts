import type { ServerWebSocket } from "bun";
//import compareLinks from "./compareLinks.ts";

const FREQUENCY = 60_000;

export default async function monitorLinks(monitorStamp = Date.now()) {
  if (Date.now() - monitorStamp > FREQUENCY) {
    console.log(
      new Date().toISOString().slice("yyyy-mm-ddT".length, -".###Z".length),
      "Monitoring links… Clients:",
      (globalThis.clients as ServerWebSocket<unknown>[])
        .map((c) => `${c.data} (${c.readyState})`)
        .join(", ") || "none"
    );

    //await compareLinks(globalThis.clients as ServerWebSocket<unknown>[]);

    for (const client of globalThis.clients as ServerWebSocket<unknown>[]) {
      if (client.readyState === 1) {
        client.send(
          JSON.stringify({
            // TODO: Change to `monitorLinks` and reuse within `compareLinks`
            type: "reportLinkCheckStatus",

            // TODO: Report only a stamp of the next check (last check is now)
            data: {
              lastCheckStamp: new Date().toISOString(),
              nextCheckStamp: new Date(Date.now() + FREQUENCY).toISOString(),
            },
          })
        );
      }
    }

    monitorStamp = Date.now();
  }

  await Bun.sleep(1000);
  monitorLinks(monitorStamp);
}
