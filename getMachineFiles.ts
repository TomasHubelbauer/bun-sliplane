import fs from "fs";

export default async function getMachineFiles() {
  const entries = await fs.promises.readdir(".", {
    withFileTypes: true,
  });

  const entriesWithStats = await Promise.all(
    entries.map(async (entry) => {
      const stats = await fs.promises.stat(entry.name);

      // Transfer over `isFile` and `isDirectory`, they won't survive the spread
      return {
        ...entry,
        ...stats,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
      };
    })
  );

  return entriesWithStats;
}
