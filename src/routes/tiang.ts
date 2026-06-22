import { Elysia, t } from "elysia";
import { db } from "../db";
import { tiang, sequences } from "../db/schema";
import { eq, desc, sql } from "drizzle-orm";

async function generateKode(): Promise<string> {
  await db.execute(sql`
    INSERT INTO sequences (nama, nilai)
    VALUES ('tiang_counter', 1)
    ON DUPLICATE KEY UPDATE nilai = nilai + 1
  `);

  const result = await db
    .select({ nilai: sequences.nilai })
    .from(sequences)
    .where(eq(sequences.nama, "tiang_counter"))
    .limit(1);

  const nilai = result[0]?.nilai ?? 1;
  return `BITNET-${String(nilai).padStart(3, "0")}`;
}

export const tiangRoutes = new Elysia({ prefix: "/api/tiang" })

  .get(
    "/",
    async ({ query }) => {
      const { jenis, kondisi, search } = query;

      let data = await db.select().from(tiang).orderBy(desc(tiang.dibuat_pada));

      if (jenis) data = data.filter((t) => t.jenis === jenis);
      if (kondisi) data = data.filter((t) => t.kondisi === kondisi);
      if (search) {
        const s = search.toLowerCase();
        data = data.filter(
          (t) =>
            t.kode.toLowerCase().includes(s) ||
            (t.label ?? "").toLowerCase().includes(s) ||
            (t.catatan ?? "").toLowerCase().includes(s)
        );
      }

      const total = data.length;
      const stats = {
        total,
        per_jenis: {
          PLN: data.filter((t) => t.jenis === "PLN").length,
          Telkom: data.filter((t) => t.jenis === "Telkom").length,
          "ISP Sendiri": data.filter((t) => t.jenis === "ISP Sendiri").length,
          Bambu: data.filter((t) => t.jenis === "Bambu").length,
          Besi: data.filter((t) => t.jenis === "Besi").length,
          Lainnya: data.filter((t) => t.jenis === "Lainnya").length,
        },
        per_kondisi: {
          Baik: data.filter((t) => t.kondisi === "Baik").length,
          "Perlu Perhatian": data.filter((t) => t.kondisi === "Perlu Perhatian").length,
          Rusak: data.filter((t) => t.kondisi === "Rusak").length,
        },
      };

      return {
        success: true,
        data: data.map((item) => ({
          ...item,
          latitude: Number(item.latitude),
          longitude: Number(item.longitude),
        })),
        stats,
      };
    },
    {
      query: t.Object({
        jenis: t.Optional(t.String()),
        kondisi: t.Optional(t.String()),
        search: t.Optional(t.String()),
      }),
    }
  )

  .get("/:id", async ({ params, set }) => {
    const id = Number(params.id);
    const result = await db.select().from(tiang).where(eq(tiang.id, id)).limit(1);

    if (result.length === 0) {
      set.status = 404;
      return { success: false, message: "Tiang tidak ditemukan" };
    }

    const item = result[0]!;
    return {
      success: true,
      data: { ...item, latitude: Number(item.latitude), longitude: Number(item.longitude) },
    };
  })

  .post(
    "/",
    async ({ body }) => {
      const kode = await generateKode();

      await db.insert(tiang).values({
        kode,
        label: body.label || null,
        latitude: String(body.latitude),
        longitude: String(body.longitude),
        jenis: body.jenis,
        kondisi: body.kondisi,
        catatan: body.catatan || null,
        dibuat_oleh: body.dibuat_oleh || "Teknisi",
      });

      return { success: true, message: `Tiang ${kode} berhasil disimpan`, kode };
    },
    {
      body: t.Object({
        label: t.Optional(t.String()),
        latitude: t.Number({ minimum: -90, maximum: 90 }),
        longitude: t.Number({ minimum: -180, maximum: 180 }),
        jenis: t.Union([
          t.Literal("PLN"),
          t.Literal("Telkom"),
          t.Literal("ISP Sendiri"),
          t.Literal("Bambu"),
          t.Literal("Besi"),
          t.Literal("Lainnya"),
        ]),
        kondisi: t.Union([
          t.Literal("Baik"),
          t.Literal("Perlu Perhatian"),
          t.Literal("Rusak"),
        ]),
        catatan: t.Optional(t.String({ maxLength: 500 })),
        dibuat_oleh: t.Optional(t.String()),
      }),
    }
  )

  .put(
    "/:id",
    async ({ params, body, set }) => {
      const id = Number(params.id);

      const existing = await db.select().from(tiang).where(eq(tiang.id, id)).limit(1);
      if (existing.length === 0) {
        set.status = 404;
        return { success: false, message: "Tiang tidak ditemukan" };
      }

      const current = existing[0]!;
      await db
        .update(tiang)
        .set({
          label: body.label ?? current.label,
          latitude: body.latitude != null ? String(body.latitude) : current.latitude,
          longitude: body.longitude != null ? String(body.longitude) : current.longitude,
          jenis: body.jenis ?? current.jenis,
          kondisi: body.kondisi ?? current.kondisi,
          catatan: body.catatan ?? current.catatan,
        })
        .where(eq(tiang.id, id));

      const [updated] = await db.select().from(tiang).where(eq(tiang.id, id));
      return {
        success: true,
        message: `Tiang ${updated!.kode} berhasil diupdate`,
        data: { ...updated!, latitude: Number(updated!.latitude), longitude: Number(updated!.longitude) },
      };
    },
    {
      body: t.Object({
        label: t.Optional(t.String()),
        latitude: t.Optional(t.Number()),
        longitude: t.Optional(t.Number()),
        jenis: t.Optional(
          t.Union([
            t.Literal("PLN"),
            t.Literal("Telkom"),
            t.Literal("ISP Sendiri"),
            t.Literal("Bambu"),
            t.Literal("Besi"),
            t.Literal("Lainnya"),
          ])
        ),
        kondisi: t.Optional(
          t.Union([
            t.Literal("Baik"),
            t.Literal("Perlu Perhatian"),
            t.Literal("Rusak"),
          ])
        ),
        catatan: t.Optional(t.String({ maxLength: 500 })),
        dibuat_oleh: t.Optional(t.String()),
      }),
    }
  )

  .delete("/:id", async ({ params, set }) => {
    const id = Number(params.id);

    const existing = await db.select().from(tiang).where(eq(tiang.id, id)).limit(1);
    if (existing.length === 0) {
      set.status = 404;
      return { success: false, message: "Tiang tidak ditemukan" };
    }

    await db.delete(tiang).where(eq(tiang.id, id));
    return { success: true, message: `Tiang ${existing[0]!.kode} berhasil dihapus` };
  });
