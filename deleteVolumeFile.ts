import type { ServerWebSocket } from "bun";
import volumePath from "./volumePath.ts";
import getVolumeFiles from "./getVolumeFiles.ts";

export default async function deleteVolumeFile(
  ws: ServerWebSocket<unknown>,
  { name }: { name: string }
) {
  await Bun.file(`${volumePath}/${name}`).unlink();
  ws.send(
    JSON.stringify({
      type: getVolumeFiles.name,
      data: await getVolumeFiles(),
    })
  );
}
