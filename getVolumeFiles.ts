import volumePath from "./volumePath.ts";
import fs from "fs";

export default async function getVolumeFiles() {
  const items = await fs.promises.readdir(volumePath, {
    withFileTypes: true,
  });

  const files = items.filter((item) => item.isFile());
  const filesWithStats = await Promise.all(
    files.map(async (file) => {
      const stats = await fs.promises.stat(`${volumePath}/${file.name}`);
      return { ...file, ...stats };
    })
  );

  return filesWithStats;
}
