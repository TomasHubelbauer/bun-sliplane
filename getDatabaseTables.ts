import db from "./db.ts";

export default function getDatabaseTables() {
  return db
    .query(`
      SELECT 
        sm.name,
        COALESCE(SUM(ds.pgsize), 0) as size
      FROM sqlite_master sm
      LEFT JOIN dbstat ds ON sm.name = ds.name
      WHERE sm.type = 'table'
      GROUP BY sm.name
      ORDER BY sm.name
    `)
    .all() as { name: string; size: number }[];
}
