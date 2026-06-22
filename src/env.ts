export const env = {
  DATABASE_HOST: process.env.DB_HOST || "localhost",
  DATABASE_PORT: Number(process.env.DB_PORT) || 3306,
  DATABASE_USER: process.env.DB_USER || "root",
  DATABASE_PASSWORD: process.env.DB_PASSWORD || "",
  DATABASE_NAME: process.env.DB_NAME || "tiang_mapping",
  PORT: Number(process.env.APP_PORT) || 3000,
  HOST: process.env.APP_HOST || "0.0.0.0",
};
