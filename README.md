# Drop-It

Drop-It is a dropshipping helper that lets you track source products from your suppliers, log scraped price offers, and instantly compare the lowest, average, and highest prices — all from a single dashboard.

## Features

- **Product tracking** — Add products by URL, link them to a supplier, and open the source listing in one click.
- **Supplier management** — Create suppliers, add their website, and enable or disable them per account.
- **Price comparison** — Seed or log scraped offers per product and see lowest/average/highest at a glance.
- **Email + password auth** — Sign up and log in with Better Auth; sessions are stored in the same SQLite database.

## Local setup

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local`:

```
DATABASE_URL=file:./drop-it.db
DATABASE_AUTH_TOKEN=           # leave empty for local file
BETTER_AUTH_SECRET=            # generate with: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
```

Push the schema (creates `drop-it.db` locally):

```bash
npm run db:push
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up, and start adding suppliers and products.

## Deploying to Vercel + Turso

1. Install the Turso CLI:
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```

2. Create a database:
   ```bash
   turso auth signup
   turso db create drop-it
   ```

3. Get the URL and a token:
   ```bash
   turso db show drop-it --url
   turso db tokens create drop-it
   ```

4. Push the schema to Turso:
   ```bash
   DATABASE_URL=<turso-url> DATABASE_AUTH_TOKEN=<turso-token> npm run db:push
   ```

5. In your Vercel project settings, add these environment variables:
   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Your Turso database URL |
   | `DATABASE_AUTH_TOKEN` | Your Turso auth token |
   | `BETTER_AUTH_SECRET` | A fresh secret (`openssl rand -base64 32`) |
   | `BETTER_AUTH_URL` | Your Vercel deployment URL (e.g. `https://drop-it.vercel.app`) |

6. Deploy.

## Tech stack

- [Next.js 15](https://nextjs.org) — App Router, Server Components, Server Actions
- [Drizzle ORM](https://orm.drizzle.team) — type-safe SQLite queries
- [Turso](https://turso.tech) — hosted libSQL / SQLite
- [Better Auth](https://better-auth.com) — email + password authentication
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)

## Notes

Password reset (forgot password / update password) is stubbed. Enabling it requires SMTP configuration in Better Auth. See the [Better Auth docs](https://www.better-auth.com/docs/concepts/email) for setup instructions.
