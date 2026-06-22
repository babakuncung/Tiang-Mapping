# 🚀 DEPLOY GUIDE — Tiang Mapper Pro BITNET
# Server: tools.ajengmedia.com
# Stack: Bun + ElysiaJS + Drizzle + MySQL

---

## STEP 1 — BUAT DATABASE MYSQL

Login ke MySQL server dan jalankan:

```sql
-- Buat database
CREATE DATABASE IF NOT EXISTS bitnet_mapper
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Buat user khusus (JANGAN pakai root di production)
CREATE USER 'bitnet_user'@'localhost' IDENTIFIED BY 'password_kuat_di_sini';
GRANT ALL PRIVILEGES ON bitnet_mapper.* TO 'bitnet_user'@'localhost';
FLUSH PRIVILEGES;

-- Verifikasi
SHOW DATABASES LIKE 'bitnet_mapper';
```

---

## STEP 2 — SETUP PROJECT DI SERVER

```bash
# Masuk ke directory web
cd /var/www/tools.ajengmedia.com   # atau path sesuai hosting kamu

# Clone / upload project
git clone <repo-url> tiang-mapper
# ATAU upload via SCP/FTP lalu:
cd tiang-mapper

# Install dependencies
bun install

# Copy dan edit .env
cp .env.example .env
nano .env
# Isi:
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=bitnet_user
# DB_PASSWORD=password_kuat_di_sini
# DB_NAME=bitnet_mapper
# APP_PORT=3000
```

---

## STEP 3 — JALANKAN MIGRASI DATABASE

```bash
# Generate migration files dari schema
bun run db:generate

# Jalankan migrasi ke MySQL
bun run db:migrate

# ATAU: push langsung tanpa migration files (development)
bun run db:push

# Verifikasi tabel terbuat:
mysql -u bitnet_user -p bitnet_mapper -e "SHOW TABLES;"
# Harus muncul: tiang, sequences
```

---

## STEP 4 — TEST LOKAL

```bash
# Jalankan server development
bun run dev

# Test di browser: http://localhost:3000
# Test API docs: http://localhost:3000/swagger

# Test API manual:
curl http://localhost:3000/api/health
# Response: {"status":"OK","app":"Tiang Mapper Pro — BITNET",...}

curl -X POST http://localhost:3000/api/tiang \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -6.914744,
    "longitude": 107.609810,
    "jenis": "ISP Sendiri",
    "kondisi": "Baik",
    "catatan": "Tiang test pertama"
  }'
```

---

## STEP 5 — DEPLOY PRODUCTION DENGAN PM2

```bash
# Install PM2 global via bun
bun add -g pm2

# Atau via npm jika tersedia
npm install -g pm2

# Buat file ecosystem PM2
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: "tiang-mapper-bitnet",
    script: "bun",
    args: "run src/index.ts",
    cwd: "/var/www/tools.ajengmedia.com/tiang-mapper",
    env: {
      NODE_ENV: "production"
    },
    // Auto restart jika crash
    autorestart: true,
    watch: false,
    max_memory_restart: "256M",
    // Log files
    log_file: "/var/log/tiang-mapper/combined.log",
    out_file: "/var/log/tiang-mapper/out.log",
    error_file: "/var/log/tiang-mapper/error.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss",
  }]
}
EOF

# Buat folder log
mkdir -p /var/log/tiang-mapper

# Start dengan PM2
pm2 start ecosystem.config.js

# Set PM2 auto-start saat server reboot
pm2 startup
pm2 save

# Cek status
pm2 status
pm2 logs tiang-mapper-bitnet
```

---

## STEP 6 — NGINX REVERSE PROXY

Tambahkan config Nginx untuk domain `tools.ajengmedia.com`:

```nginx
# File: /etc/nginx/sites-available/tools.ajengmedia.com

server {
    listen 80;
    server_name tools.ajengmedia.com;

    # Redirect ke HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tools.ajengmedia.com;

    # SSL (generate dengan: certbot --nginx -d tools.ajengmedia.com)
    ssl_certificate     /etc/letsencrypt/live/tools.ajengmedia.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tools.ajengmedia.com/privkey.pem;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Static files — langsung dari Nginx (lebih cepat)
    location ~* \.(css|js|ico|png|jpg|svg|woff2)$ {
        root /var/www/tools.ajengmedia.com/tiang-mapper/public;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # Tiang Mapper app (Bun/ElysiaJS di port 3000)
    location /tiang-mapper {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Root redirect ke tiang-mapper
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Aktifkan site
ln -s /etc/nginx/sites-available/tools.ajengmedia.com /etc/nginx/sites-enabled/

# Install SSL dengan Certbot
certbot --nginx -d tools.ajengmedia.com

# Test dan reload Nginx
nginx -t && systemctl reload nginx
```

---

## STEP 7 — VERIFIKASI DEPLOYMENT

```bash
# Cek semua service berjalan
pm2 status                          # PM2 process
systemctl status nginx              # Nginx
systemctl status mysql              # MySQL

# Test endpoint production
curl https://tools.ajengmedia.com/api/health

# Test CRUD
curl -X POST https://tools.ajengmedia.com/api/tiang \
  -H "Content-Type: application/json" \
  -d '{"latitude":-6.9,"longitude":107.6,"jenis":"ISP Sendiri","kondisi":"Baik"}'

# Cek data di database
mysql -u bitnet_user -p bitnet_mapper \
  -e "SELECT kode, jenis, kondisi, latitude, longitude FROM tiang;"
```

---

## MONITORING & MAINTENANCE

```bash
# Lihat log realtime
pm2 logs tiang-mapper-bitnet --lines 50

# Restart app (setelah update kode)
pm2 restart tiang-mapper-bitnet

# Reload tanpa downtime
pm2 reload tiang-mapper-bitnet

# Database backup otomatis (tambahkan ke crontab)
crontab -e
# Tambahkan:
# 0 2 * * * mysqldump -u bitnet_user -p'pass' bitnet_mapper > /backup/tiang-$(date +\%Y\%m\%d).sql

# Update dependencies
bun update
bun run db:migrate  # jika ada perubahan schema
pm2 restart tiang-mapper-bitnet
```

---

## ENVIRONMENT CHECKLIST

```
✅ Bun terinstall               → bun --version
✅ MySQL berjalan                → systemctl status mysql
✅ Database dibuat               → SHOW DATABASES
✅ Tabel ter-migrasi             → SHOW TABLES
✅ PM2 berjalan                  → pm2 status
✅ Nginx config valid            → nginx -t
✅ SSL aktif                     → https:// berjalan
✅ API health check OK           → GET /api/health
✅ Frontend bisa tambah tiang    → POST /api/tiang
✅ Export KML berfungsi          → GET /api/export/kml
✅ tools.ajengmedia.com dapat diakses → browser test
```

---

## TROUBLESHOOTING UMUM

| Masalah | Solusi |
|---------|--------|
| `bun: command not found` | Install Bun: `curl -fsSL https://bun.sh/install \| bash` |
| MySQL connection refused | Cek: `systemctl start mysql` dan `.env` credentials |
| Port 3000 sudah terpakai | Ganti `APP_PORT=3001` di `.env`, update Nginx proxy_pass |
| `Cannot find module 'drizzle-orm'` | Jalankan ulang `bun install` |
| Migration gagal | Cek `DB_NAME` dan user privileges di MySQL |
| Marker tidak muncul di peta | Buka browser console, cek error `GET /api/tiang` |
| Export KML kosong | Tambahkan dulu beberapa tiang, baru export |
```
