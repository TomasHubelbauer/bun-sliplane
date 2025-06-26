import { useMemo } from "react";
import formatHumanBytes from "./formatHumanBytes.ts";

type MemoryProps = {
  total: number;
  free: number;
  rss: number;
};

export default function Memory({ total, free, rss }: MemoryProps) {
  const used = useMemo(() => total - free, [total, free]);
  const title = useMemo(
    () =>
      `Memory usage: ${formatHumanBytes(used)} / ${formatHumanBytes(
        total
      )} (${~~((used / total) * 100)}%) | RSS: ${formatHumanBytes(rss)}`,
    [used, total]
  );

  return <progress value={used} max={total} title={title} />;
}
