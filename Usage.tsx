import { useMemo } from "react";
import formatHumanBytes from "./formatHumanBytes.ts";

type UsageProps = {
  stats: {
    bsize: number;
    bfree: number;
    blocks: number;
  };
};

export default function Usage({ stats }: UsageProps) {
  const free = useMemo(
    () => stats.bsize * stats.bfree,
    [stats.bsize, stats.bfree]
  );

  const size = useMemo(
    () => stats.bsize * stats.blocks,
    [stats.bsize, stats.blocks]
  );

  const used = useMemo(() => size - free, [size, free]);

  const ratio = useMemo(() => used / size, [used, size]);

  const title = useMemo(
    () =>
      `${formatHumanBytes(free)} free of ${formatHumanBytes(
        size
      )} (${formatHumanBytes(used)} used) | ${
        (ratio * 100).toFixed(2) + "%"
      } full`,
    [free, size, used, ratio]
  );

  return <progress max={1} value={ratio} title={title} />;
}
