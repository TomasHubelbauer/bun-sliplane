import { $ } from "bun";

// See https://github.com/oven-sh/bun/issues/5735 for feature request
export default async function zipDirectory(name: string): Promise<Uint8Array> {
  // Use tar with gzip compression for cross-platform compatibility
  // Both macOS and Ubuntu have tar available by default
  const result = await $`tar -czf - -C ${name} .`.quiet();

  // Convert the result to Uint8Array
  return new Uint8Array(result.arrayBuffer());
}
