import fs from "fs";
import volumePath from "./volumePath.ts";

export default async function getStats() {
  return await fs.promises.statfs(volumePath);
}
