import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";

const { Client } = pg;
const file = process.argv[2];

if (!file) {
  console.error("Usage: node backend/scripts/run-sql.mjs <sql-file>");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set. Set it in PowerShell before running this command.");
  process.exit(1);
}

const sqlPath = resolve(process.cwd(), file);
const sql = await readFile(sqlPath, "utf8");
const client = new Client({ connectionString });

try {
  await client.connect();
  await client.query(sql);
  console.log(`Applied SQL file: ${sqlPath}`);
} finally {
  await client.end();
}
