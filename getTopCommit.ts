import { inflateSync } from "zlib";

const HASH_PREFIX_LENGTH = 2;
const SHORT_HASH_LENGTH = 7;

// Note that this is a replacement for `git log --oneline -1` so that I do not
// have to install the Git binary to the Bun Docker container.
export default async function getTopCommit() {
  // Note we assume we're always on the main branch
  const commitHash = (await Bun.file(".git/refs/heads/main").text()).trim();

  // Note Git stores objects in folders named by the first 2 chars of the hash
  const hashPrefix = commitHash.slice(0, HASH_PREFIX_LENGTH);
  const hashSuffix = commitHash.slice(HASH_PREFIX_LENGTH);
  const objectPath = `.git/objects/${hashPrefix}/${hashSuffix}`;

  const compressedData = await Bun.file(objectPath).bytes();
  const decompressedData = inflateSync(compressedData);
  const commit = new TextDecoder().decode(decompressedData);

  // Note the commit message comes after a blank line in the commit object blob
  const index = commit.indexOf("\n\n") + "\n\n".length;
  const text = commit.slice(index, commit.indexOf("\n", index));

  return {
    hash: commitHash.slice(0, SHORT_HASH_LENGTH),
    text,
  };
}
