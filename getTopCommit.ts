import zlib from "zlib";
import { Glob } from "bun";

const HASH_PREFIX_LENGTH = 2;
const SHORT_HASH_LENGTH = 7;

async function readLooseObject(hash: string) {
  const hashPrefix = hash.slice(0, HASH_PREFIX_LENGTH);
  const hashSuffix = hash.slice(HASH_PREFIX_LENGTH);
  const objectPath = `.git/objects/${hashPrefix}/${hashSuffix}`;

  try {
    return await Bun.file(objectPath).bytes();
  } catch {
    return null;
  }
}

async function readPackedObject(hash: string) {
  try {
    const glob = new Glob(".git/objects/pack/*.idx");
    
    for await (const idxPath of glob.scan()) {
      const packPath = idxPath.replace(".idx", ".pack");

      const idxData = await Bun.file(idxPath).bytes();
      const packData = await Bun.file(packPath).bytes();

      const hashBytes = Buffer.from(hash, "hex");
      const offset = findOffsetInIndex(idxData, hashBytes);

      if (offset !== -1) {
        return extractObjectFromPack(packData, offset);
      }
    }
  } catch {
    return null;
  }

  return null;
}

function findOffsetInIndex(idxData: Uint8Array, hashBytes: Buffer): number {
  const view = new DataView(idxData.buffer);

  if (view.getUint32(0) !== 0xff744f63 || view.getUint32(4) !== 2) {
    return -1;
  }

  const fanout: number[] = [];
  for (let i = 0; i < 256; i++) {
    fanout.push(view.getUint32(8 + i * 4));
  }

  const totalObjects = fanout[255];
  const hashesStart = 8 + 256 * 4;

  const firstByte = hashBytes[0];
  const start = firstByte === 0 ? 0 : fanout[firstByte - 1];
  const end = fanout[firstByte];

  for (let i = start; i < end; i++) {
    let match = true;
    for (let j = 0; j < 20; j++) {
      if (idxData[hashesStart + i * 20 + j] !== hashBytes[j]) {
        match = false;
        break;
      }
    }

    if (match) {
      const offsetsStart = hashesStart + totalObjects * 20 + totalObjects * 4;
      return view.getUint32(offsetsStart + i * 4);
    }
  }

  return -1;
}

function extractObjectFromPack(
  packData: Uint8Array,
  offset: number
): Uint8Array {
  let pos = offset;
  let byte = packData[pos++];
  const type = (byte >> 4) & 7;
  let size = byte & 15;
  let shift = 4;

  while (byte & 0x80) {
    byte = packData[pos++];
    size |= (byte & 0x7f) << shift;
    shift += 7;
  }

  if (type === 6 || type === 7) {
    throw new Error("Delta objects not supported");
  }

  const compressed = packData.slice(pos, pos + size * 2);
  return zlib.inflateSync(compressed);
}

// Note that this is a replacement for `git log --oneline -1` so that I do not
// have to install the Git binary to the Bun Docker container.
export default async function getTopCommit() {
  // Note we assume we're always on the main branch
  const commitHash = (await Bun.file(".git/refs/heads/main").text()).trim();

  let decompressedData: Uint8Array | null = await readLooseObject(commitHash);

  if (!decompressedData) {
    const packedData = await readPackedObject(commitHash);
    if (packedData) {
      decompressedData = packedData;
    } else {
      throw new Error(`Could not find commit object for ${commitHash}`);
    }
  } else {
    decompressedData = zlib.inflateSync(decompressedData);
  }

  const commit = new TextDecoder().decode(decompressedData);

  // Note the commit message comes after a blank line in the commit object blob
  const index = commit.indexOf("\n\n") + "\n\n".length;
  const text = commit.slice(index, commit.indexOf("\n", index));

  return {
    hash: commitHash.slice(0, SHORT_HASH_LENGTH),
    text,
  };
}
