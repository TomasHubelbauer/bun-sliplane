import { Database } from "bun:sqlite";
import volumePath from "./volumePath.ts";

const DATABASE_PATH = volumePath + "/db.sqlite";
const db = new Database(DATABASE_PATH);

db.run(
  "CREATE TABLE IF NOT EXISTS items (stamp TEXT PRIMARY KEY, name TEXT, text TEXT)"
);

try {
  db.run('ALTER TABLE items ADD COLUMN attachments TEXT DEFAULT "[]"');
} catch (error) {
  if (error.message !== "duplicate column name: attachments") {
    throw error;
  }
}

db.run("CREATE TABLE IF NOT EXISTS audits (name TEXT PRIMARY KEY, stamp TEXT)");

export default db;
