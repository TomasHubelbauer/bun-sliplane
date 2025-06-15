import { test, expect } from "bun:test";
import { zipDirectory } from "./zipDirectory";
import { $ } from "bun";

test("zipDirectory should create a valid tar.gz archive from .git directory", async () => {
  // Zip the .git directory
  const zipData = await zipDirectory(".git");
  
  // Verify it's a Uint8Array
  expect(zipData).toBeInstanceOf(Uint8Array);
  
  // Verify it has content
  expect(zipData.length).toBeGreaterThan(0);
  
  // Verify it's a valid gzip file by checking magic bytes
  // Gzip files start with 0x1f 0x8b
  expect(zipData[0]).toBe(0x1f);
  expect(zipData[1]).toBe(0x8b);
  
  // Create a temporary directory to extract and verify
  const tempDir = await $`mktemp -d`.text();
  const cleanTempDir = tempDir.trim();
  
  try {
    // Write the zip data to a temporary file
    const tempFile = `${cleanTempDir}/test.tar.gz`;
    await Bun.write(tempFile, zipData);
    
    // Extract it to verify it's valid
    await $`tar -xzf ${tempFile} -C ${cleanTempDir}`;
    
    // Check that some expected .git files exist
    const gitFiles = await $`ls -la ${cleanTempDir}`.text();
    expect(gitFiles).toContain("HEAD");
    expect(gitFiles).toContain("config");
    expect(gitFiles).toContain("objects");
    
  } finally {
    // Clean up
    await $`rm -rf ${cleanTempDir}`;
  }
});

test("zipDirectory can be used with Bun Response", async () => {
  const zipData = await zipDirectory(".git");
  
  // Verify it works with Response constructor
  const response = new Response(zipData, {
    headers: {
      "Content-Type": "application/gzip",
      "Content-Disposition": "attachment; filename=archive.tar.gz"
    }
  });
  
  expect(response).toBeInstanceOf(Response);
  expect(response.headers.get("Content-Type")).toBe("application/gzip");
});