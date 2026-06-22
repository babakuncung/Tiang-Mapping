import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "../env";
import * as schema from "./schema";

export const pool = mysql.createPool({
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db = drizzle(pool, { schema, mode: "default" });

export async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL terkoneksi ke:", env.DATABASE_NAME);
    conn.release();
  } catch (err) {
    console.error("❌ Gagal koneksi MySQL:", err);
    process.exit(1);
  }
}
