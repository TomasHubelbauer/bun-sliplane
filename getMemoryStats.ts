import os from "os";

export default function getMemoryStats() {
  return {
    total: os.totalmem(),
    free: os.freemem(),
  };
}
