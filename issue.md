# Tiang Mapping — Backend API Project Setup

## Deskripsi

Buat project backend API baru di repository ini menggunakan **Bun** sebagai runtime, **ElysiaJS** sebagai web framework, **Drizzle ORM** untuk database layer, dan **MySQL** sebagai database.

---

## 1. Inisialisasi Project

- Inisialisasi project Bun di root folder (`bun init`)
- Setup TypeScript config (`tsconfig.json`)
- Buat struktur folder standar:
  ```
  src/
  ├── index.ts          # Entry point, setup Elysia server
  ├── db/
  │   ├── index.ts      # Koneksi database (Drizzle + MySQL)
  │   └── schema.ts     # Definisi schema/tabel Drizzle
  ├── routes/
  │   └── index.ts      # Definisi routes Elysia
  └── env.ts            # Validasi & load environment variables
  drizzle.config.ts     # Konfigurasi Drizzle Kit (migrations)
  .env                  # Environment variables (DB credentials, port, dll)
  .env.example          # Template environment variables
  ```

---

## 2. Install Dependencies

### Production
- `elysia` — Web framework
- `drizzle-orm` — ORM
- `mysql2` — MySQL driver (digunakan oleh Drizzle)

### Development
- `drizzle-kit` — CLI tool untuk generate & run migrations
- `@types/bun` — Type definitions untuk Bun

---

## 3. Setup Database Connection

- Buat koneksi MySQL menggunakan `mysql2` + `drizzle-orm`
- Konfigurasi koneksi dibaca dari environment variables (`.env`):
  - `DATABASE_HOST`
  - `DATABASE_PORT`
  - `DATABASE_USER`
  - `DATABASE_PASSWORD`
  - `DATABASE_NAME`

---

## 4. Setup Drizzle Schema & Migrations

- Buat minimal 1 contoh tabel di `schema.ts` (misalnya tabel `users` dengan kolom `id`, `name`, `email`, `created_at`)
- Setup `drizzle.config.ts` agar Drizzle Kit tahu lokasi schema dan koneksi database
- Tambahkan npm scripts di `package.json`:
  - `db:generate` — Generate migration files
  - `db:migrate` — Jalankan migration
  - `db:studio` — Buka Drizzle Studio (GUI)

---

## 5. Setup ElysiaJS Server

- Buat instance Elysia di `src/index.ts`
- Pasang minimal routes:
  - `GET /` — Health check, return `{ status: "ok" }`
  - `GET /users` — Contoh endpoint ambil data dari database
  - `POST /users` — Contoh endpoint insert data ke database
- Gunakan port dari environment variable (`PORT`), default `3000`
- Tambahkan basic error handling

---

## 6. Scripts di `package.json`

```json
{
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "start": "bun run src/index.ts",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

---

## 7. File `.env.example`

Buat template environment variables agar developer lain tahu variable apa saja yang dibutuhkan:

```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_NAME=tiang_mapping
PORT=3000
```

---

## 8. Tambahkan `.gitignore`

Pastikan file-file berikut tidak masuk ke Git:
- `node_modules/`
- `.env`
- `drizzle/` (folder output migrations, opsional)

---

## Kriteria Selesai

- [ ] Project bisa di-start dengan `bun run dev` tanpa error
- [ ] Koneksi ke MySQL berhasil saat server start
- [ ] Endpoint `GET /` mengembalikan response health check
- [ ] Endpoint CRUD `/users` berfungsi dengan database
- [ ] Migration bisa di-generate dan di-run via Drizzle Kit
- [ ] File `.env.example` tersedia sebagai referensi


## Catatan Implementasi
- Cukup sampaikan kode dasar (*scaffolding*/ *skeleton*) saja. Tidak perlu endpoint yang sudah kompleks, dan buatlah semudah mungkin untuk di implementasikan
- Gunakan Struktur kode yang rapi, modular, dan starndar (misalnya memisahkan inisialisasi *database* dengan *routes*, dan gunakan enviroment variable untuk konfigurasi)
- Sediakan script command di dalam 'package.json' yang memungkinkan project dijalankan dengan mudah via Bun (misal 'bun run dev', 'bun run db:migrate', dll)