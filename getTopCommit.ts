import { $ } from "bun";

export default async function getTopCommit() {
  const line = await $`git log --oneline -1`.nothrow().text();
  const match = line.match(/^(?<hash>\w{7}) (?<text>.+)\n$/);
  if (match?.groups) {
    return match.groups;
  }

  console.log("Failed to parse git log output:", JSON.stringify(line));
}
