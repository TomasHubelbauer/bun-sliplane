import type { ServerWebSocket } from "bun";
import volumePath from "./volumePath.ts";
import getVolumeFiles from "./getVolumeFiles.ts";

export default async function deleteVolumeFiles(
  ws: ServerWebSocket<unknown>,
  { names }: { names: string[] }
) {
  for (const name of names) {
    await Bun.file(`${volumePath}/${name}`).unlink();
  }

  ws.send(
    JSON.stringify({
      type: getVolumeFiles.name,
      data: await getVolumeFiles(),
    })
  );
}
