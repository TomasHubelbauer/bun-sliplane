export default function formatHumanStamp(stamp: string) {
  if (!stamp) {
    return "";
  }

  const now = new Date();
  const date = new Date(stamp);

  if (isNaN(date.getTime())) {
    return "";
  }

  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) {
    return "now";
  }

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} minutes ago`;
  }

  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)} hours ago`;
  }

  return `${Math.floor(seconds / 86400)} days ago`;
}

if (import.meta.main) {
  for (const { test, expected } of [
    { test: () => formatHumanStamp(""), expected: "" },
    { test: () => formatHumanStamp(new Date().toISOString()), expected: "now" },
  ]) {
    const actual = test();
    if (actual !== expected) {
      console.log(
        test
          .toString()
          .slice(`() => ${formatHumanStamp.name}(`.length, -")".length)
      );
      console.log("\t", actual);
      console.log("\t", expected);
    }
  }
}
