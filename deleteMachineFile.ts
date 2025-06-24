import type { ServerWebSocket } from "bun";
import getMachineFiles from "./getMachineFiles.ts";

export default async function deleteMachineFile(
  ws: ServerWebSocket<unknown>,
  { name }: { name: string }
) {
  await Bun.file(name).unlink();
  ws.send(
    JSON.stringify({
      type: getMachineFiles.name,
      data: await getMachineFiles(),
    })
  );
}
