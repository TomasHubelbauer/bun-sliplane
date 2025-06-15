import { $ } from "bun";

export default async function getTopCommit() {
  const line = await $`git log --oneline -1`.text();
  return line.match(/^(?<hash>\w{7}) (?<text>.+)\n$/)?.groups;
}
