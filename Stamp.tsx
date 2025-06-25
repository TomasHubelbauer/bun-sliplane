import { useEffect, useState, memo, useMemo } from "react";
import formatHumanStamp from "./formatHumanStamp.ts";

type StampProps = {
  stamp: string;
  showWord?: boolean;
  shortUnit?: boolean;
};

export default memo(function Stamp({
  stamp,
  showWord = true,
  shortUnit = false,
}: StampProps) {
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
    humanStamp && (
      <time dateTime={stamp} title={stamp} className={Stamp.name}>
        {humanStamp.number && (
          <>
            <span>{humanStamp.number}</span>{" "}
          </>
        )}
        {humanStamp.unit &&
          `${shortUnit ? humanStamp.unit[0] : humanStamp.unit} `}
        {showWord && humanStamp.word}
      </time>
    )
  );
});
