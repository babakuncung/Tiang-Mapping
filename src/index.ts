import { Elysia } from "elysia";
import { env } from "./env";
import { routes } from "./routes";

const app = new Elysia()
  .use(routes)
  .onError(({ error }) => {
    console.error(error);
    return { error: "Internal Server Error" };
  })
  .listen(env.PORT);

console.log(`🚀 Server running at http://localhost:${env.PORT}`);
