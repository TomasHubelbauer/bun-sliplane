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
    () => formatHumanBytes(stats.bsize * stats.bfree),
    [stats.bsize, stats.bfree]
  );

  const size = useMemo(
    () => formatHumanBytes(stats.bsize * stats.blocks),
    [stats.bsize, stats.blocks]
  );

  const ratio = useMemo(
    () => stats.bfree / stats.blocks,
    [stats.bfree, stats.blocks]
  );

  const title = useMemo(
    () => `${free} / ${size} | ${(ratio * 100).toFixed(2) + "%"} full`,
    [free, size, ratio]
  );

  return <progress max={100} value={ratio * 100} title={title} />;
}
