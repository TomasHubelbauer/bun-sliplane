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

db.run(
  "CREATE TABLE IF NOT EXISTS links (url TEXT PRIMARY KEY, checkStamp TEXT, changeStamp TEXT, html TEXT)"
);

try {
  db.run('ALTER TABLE links ADD COLUMN mask TEXT DEFAULT ""');
} catch (error) {
  if (error.message !== "duplicate column name: mask") {
    throw error;
  }
}

try {
  db.run('ALTER TABLE links ADD COLUMN runMaskPositive TEXT DEFAULT ""');
} catch (error) {
  if (error.message !== "duplicate column name: runMaskPositive") {
    throw error;
  }
}

try {
  db.run('ALTER TABLE links ADD COLUMN runMaskNegative TEXT DEFAULT ""');
} catch (error) {
  if (error.message !== "duplicate column name: runMaskNegative") {
    throw error;
  }
}

db.run(
  "CREATE TABLE IF NOT EXISTS dailies (name TEXT, note TEXT, icon TEXT, stamp TEXT)"
);

db.run("CREATE TABLE IF NOT EXISTS errands (name TEXT, type TEXT, data TEXT)");

export default db;
