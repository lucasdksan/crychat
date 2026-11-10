import "dotenv/config";
import { defineConfig } from "prisma/config";

function migrationDatabaseUrl(): string {
  if (process.env.DIRECT_URL) {
    return process.env.DIRECT_URL;
  }
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  return "postgresql://postgres:postgres@127.0.0.1:5432/crychat?schema=public";
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrationDatabaseUrl(),
  },
});
