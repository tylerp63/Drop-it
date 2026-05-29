import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as authSchema from "@/lib/db/auth-schema";
import * as appSchema from "@/lib/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: { ...authSchema, ...appSchema },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
});
