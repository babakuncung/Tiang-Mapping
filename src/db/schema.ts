import {
  mysqlTable,
  int,
  varchar,
  decimal,
  mysqlEnum,
  text,
  timestamp,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const tiang = mysqlTable("tiang", {
  id: int("id").primaryKey().autoincrement(),
  kode: varchar("kode", { length: 20 }).notNull().unique(),
  label: varchar("label", { length: 100 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  jenis: mysqlEnum("jenis", [
    "PLN",
    "Telkom",
    "ISP Sendiri",
    "Bambu",
    "Besi",
    "Lainnya",
  ]).notNull().default("ISP Sendiri"),
  kondisi: mysqlEnum("kondisi", ["Baik", "Perlu Perhatian", "Rusak"])
    .notNull()
    .default("Baik"),
  catatan: text("catatan"),
  foto_url: varchar("foto_url", { length: 500 }),
  dibuat_oleh: varchar("dibuat_oleh", { length: 100 }).default("Teknisi"),
  dibuat_pada: timestamp("dibuat_pada")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  diupdate_pada: timestamp("diupdate_pada")
    .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
    .notNull(),
});

export const sequences = mysqlTable("sequences", {
  nama: varchar("nama", { length: 50 }).primaryKey(),
  nilai: int("nilai").notNull().default(0),
});

export type Tiang = typeof tiang.$inferSelect;
export type TiangBaru = typeof tiang.$inferInsert;
