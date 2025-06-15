import { useEffect, useState, memo } from "react";
import formatHumanStamp from "./formatHumanStamp.ts";

type StampProps = {
  stamp: string;
};

export default memo(function Stamp({ stamp }: StampProps) {
  const [humanStamp, setHumanStamp] = useState(formatHumanStamp(stamp));

  useEffect(() => {
    const handle = setInterval(
      () => setHumanStamp(formatHumanStamp(stamp)),
      1000
    );
    return () => {
      clearInterval(handle);
    };
  }, [stamp]);

  return (
    <time dateTime={stamp} title={stamp} className={Stamp.name}>
      {humanStamp}
    </time>
  );
});
