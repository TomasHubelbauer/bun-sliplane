import type { ServerWebSocket } from "bun";
import getMachineFiles from "./getMachineFiles.ts";

export default async function deleteMachineFiles(
  ws: ServerWebSocket<unknown>,
  { names }: { names: string[] }
) {
  for (const name of names) {
    await Bun.file(name).unlink();
  }

  ws.send(
    JSON.stringify({
      type: getMachineFiles.name,
      data: await getMachineFiles(),
    })
  );
}
