# 🗼 Tiang Mapper Pro — BITNET

Aplikasi web survei infrastruktur tiang jaringan RT RW NET.
Stack: **Bun + ElysiaJS + Drizzle ORM + MySQL**

---

## Development

```bash
# Install dependencies
bun install

# Setup environment
cp .env.example .env
# Edit .env sesuai kredensial MySQL lokal

# Push schema ke database
bun run db:push

# Jalankan server (hot reload)
bun run dev
```

Buka: http://localhost:3000
API docs: http://localhost:3000/swagger

---

## Production Deploy (Linux Server)

### 1. MySQL

```sql
CREATE DATABASE IF NOT EXISTS bitnet_mapper
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'bitnet_user'@'localhost' IDENTIFIED BY 'password_kuat';
GRANT ALL PRIVILEGES ON bitnet_mapper.* TO 'bitnet_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Setup Project

```bash
cd /var/www/tools.ajengmedia.com
git clone <repo-url> tiang-mapper && cd tiang-mapper
bun install
cp .env.example .env && nano .env
bun run db:push
```

### 3. PM2

```bash
npm install -g pm2
mkdir -p /var/log/tiang-mapper
pm2 start ecosystem.config.js
pm2 startup && pm2 save
```

### 4. Nginx + SSL

```bash
# Copy nginx.conf ke /etc/nginx/sites-available/tools.ajengmedia.com
ln -s /etc/nginx/sites-available/tools.ajengmedia.com /etc/nginx/sites-enabled/
certbot --nginx -d tools.ajengmedia.com
nginx -t && systemctl reload nginx
```

---

## Scripts

| Script | Fungsi |
|--------|--------|
| `bun run dev` | Development server (hot reload) |
| `bun run start` | Production server |
| `bun run db:push` | Push schema ke MySQL |
| `bun run db:generate` | Generate migration files |
| `bun run db:migrate` | Jalankan migrations |
| `bun run db:studio` | Drizzle Studio (GUI database) |

---

## API Endpoints

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| GET | `/api/tiang` | List semua tiang (+ filter) |
| POST | `/api/tiang` | Tambah tiang baru |
| PUT | `/api/tiang/:id` | Update tiang |
| DELETE | `/api/tiang/:id` | Hapus tiang |
| GET | `/api/export/kml` | Export Google Earth KML |
| GET | `/api/export/csv` | Export Excel CSV |
| GET | `/api/export/json` | Backup JSON |
| GET | `/api/health` | Health check |

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| MySQL connection refused | `systemctl start mysql`, cek `.env` |
| Port 3000 terpakai | Ganti `APP_PORT=3001` di `.env` |
| `Cannot find module` | Jalankan `bun install` |
| Migration gagal | Cek `DB_NAME` dan user privileges |
| Marker tidak muncul | Buka browser console, cek `GET /api/tiang` |
