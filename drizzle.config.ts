import type { Config } from "drizzle-kit";
import "dotenv/config";

export default {
  schema: "./lib/db/*.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
} satisfies Config;
