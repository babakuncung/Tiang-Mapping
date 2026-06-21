import { Elysia, t } from "elysia";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export const routes = new Elysia()
  .get("/", () => ({ status: "ok" }))

  .get("/users", async () => {
    const result = await db.select().from(users);
    return result;
  })

  .post(
    "/users",
    async ({ body }) => {
      await db.insert(users).values({
        name: body.name,
        email: body.email,
      });
      return { message: "User created" };
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
      }),
    }
  );
