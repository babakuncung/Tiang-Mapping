import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { staticPlugin } from "@elysiajs/static";
import { env } from "./env";
import { testConnection } from "./db";
import { tiangRoutes } from "./routes/tiang";
import { exportRoutes } from "./routes/export";

await testConnection();

const app = new Elysia()
  .use(
    cors({
      origin: [
        "https://tools.ajengmedia.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: "Tiang Mapper API — BITNET",
          version: "1.0.0",
          description: "API survei infrastruktur tiang jaringan BITNET RT RW NET",
        },
        tags: [
          { name: "Tiang", description: "CRUD data tiang" },
          { name: "Export", description: "Export KML/CSV/JSON" },
        ],
      },
    })
  )
  .use(staticPlugin({ assets: "public", prefix: "/" }))
  .use(tiangRoutes)
  .use(exportRoutes)
  .get("/api/health", () => ({
    status: "OK",
    app: "Tiang Mapper Pro — BITNET",
    version: "1.0.0",
    waktu: new Date().toISOString(),
  }))
  .onError(({ code, error }) => {
    console.error(`[${code}]`, error);
    return {
      success: false,
      code,
      message: (error as any).message || "Terjadi kesalahan server",
    };
  })
  .listen({ port: env.PORT, hostname: env.HOST });

console.log(`
╔════════════════════════════════════════╗
║  🗼 TIANG MAPPER PRO — BITNET          ║
║  tools.ajengmedia.com                  ║
╠════════════════════════════════════════╣
║  Server  : http://${env.HOST}:${env.PORT}        ║
║  API docs: http://localhost:${env.PORT}/swagger  ║
║  Status  : Running ✅                  ║
╚════════════════════════════════════════╝
`);
