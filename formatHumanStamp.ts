export default function formatHumanStamp(stamp: string) {
  if (!stamp) {
    return;
  }

  const now = new Date();
  const date = new Date(stamp);

  if (isNaN(date.getTime())) {
    return;
  }

  const diffSigned = now.getTime() - date.getTime();
  const diff = Math.abs(diffSigned);
  const seconds = Math.floor(diff / 1000);

  if (!seconds) {
    return { word: "now" };
  }

  const word = diffSigned < 0 ? "away" : "ago";

  if (seconds < 60) {
    return { number: seconds, unit: `second${seconds === 1 ? "" : "s"}`, word };
  }

  if (seconds < 3600) {
    return {
      number: Math.floor(seconds / 60),
      unit: `minute${Math.floor(seconds / 60) === 1 ? "" : "s"}`,
      word,
    };
  }

  if (seconds < 86400) {
    return {
      number: Math.floor(seconds / 3600),
      unit: `hour${Math.floor(seconds / 3600) === 1 ? "" : "s"}`,
      word,
    };
  }

  return {
    number: Math.floor(seconds / 86400),
    unit: `day${Math.floor(seconds / 86400) === 1 ? "" : "s"}`,
    word,
  };
}
