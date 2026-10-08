import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { neon } from "@neondatabase/serverless";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlFile = path.join(__dirname, "../migrations/006_billing.sql");

const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("Defina POSTGRES_URL ou DATABASE_URL.");
  process.exit(1);
}

const sql = neon(url);
const ddl = fs
  .readFileSync(sqlFile, "utf8")
  .replace(/--[^\n]*/g, "")
  .trim();
const statements = ddl
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

for (const statement of statements) {
  await sql.query(statement);
  console.log("OK:", statement.slice(0, 60).replace(/\s+/g, " "), "...");
}

console.log("Migração billing (006) concluída.");
