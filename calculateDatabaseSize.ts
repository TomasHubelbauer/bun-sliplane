import db from "./db";
import volumePath from "./volumePath.ts";

const DATABASE_PATH = volumePath + "/db.sqlite";

// Note that either of the methods here give size including dead space
export default function calculateDatabaseSize() {
  const { size } = db
    .query(
      "SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()"
    )
    .get() as { size: number };

  if (size !== Bun.file(DATABASE_PATH).size) {
    throw new Error(
      `Database size mismatch: calculated ${size} bytes, actual ${
        Bun.file(DATABASE_PATH).size
      } bytes`
    );
  }

  return size;
}
