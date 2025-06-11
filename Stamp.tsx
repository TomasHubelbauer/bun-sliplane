import formatHumanStamp from "./formatHumanStamp.ts";

type StampProps = {
  stamp: string;
};

export default function Stamp({ stamp }: StampProps) {
  return (
    <time dateTime={stamp} title={stamp}>
      {formatHumanStamp(stamp)}
    </time>
  );
}
