import { useMemo, memo } from "react";
import formatHumanBytes from "./formatHumanBytes.ts";
import type { Stats } from "./Stats.ts";

type UsageProps = Stats;

export default memo(function Usage({ bsize, bfree, blocks }: UsageProps) {
  const free = useMemo(() => bsize * bfree, [bsize, bfree]);
  const size = useMemo(() => bsize * blocks, [bsize, blocks]);
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
});
