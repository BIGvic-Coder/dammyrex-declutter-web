# DammyRex Declutter

Website and backend for **DammyRex Declutter**, a Nigerian declutter business selling neatly used
household items (fridges, freezers, gas cookers, fans, ACs, beds, chairs, tables…).

People who want to declutter submit items → the owner reviews and posts them → buyers book an
in-person inspection → deals are closed on WhatsApp. No online payment in v1.

| App    | Package         | Stack                                                       |
| ------ | --------------- | ----------------------------------------------------------- |
| `api/` | `dammyrex-api`  | NestJS, TypeScript, Prisma, PostgreSQL (Neon), Cloudinary, JWT |
| `web/` | `dammyrex-web`  | Next.js (App Router), TypeScript, Tailwind CSS, SSR          |

## Requirements

- Node.js 20+
- A free [Neon](https://neon.tech) PostgreSQL database
- A free [Cloudinary](https://cloudinary.com) account

## Setup

```powershell
# 1. Install dependencies for both apps
npm run install:all

# 2. Create env files from the examples, then fill in the values
Copy-Item api\.env.example api\.env
Copy-Item web\.env.example web\.env.local

# 3. Create the database tables and seed categories + the admin account
cd api
npx prisma migrate dev --name init
npm run seed
cd ..

# 4. Run both apps (two terminals)
npm run dev:api   # http://localhost:4000
npm run dev:web   # http://localhost:3000
```

Check the API is up and connected to the database: <http://localhost:4000/health> → `{"ok":true}`

## Environment variables

### `api/.env`

| Key | Where to get it |
| --- | --- |
| `DATABASE_URL` | Neon dashboard → your project → **Connect** → keep "Connection pooling" **on** → copy the string |
| `DIRECT_URL` | Same screen with "Connection pooling" **off** (host without `-pooler`) |
| `JWT_SECRET` | Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Your choice; used by `npm run seed` to create/update the admin login (password ≥ 10 chars) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary console → **Dashboard** (or Settings → API Keys) |
| `WHATSAPP_NUMBER` | Business number, digits only, e.g. `2348012345678` |
| `PORT` | `4000` locally |
| `WEB_ORIGIN` | Website URL(s) allowed by CORS, comma-separated |

### `web/.env.local`

| Key | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | API URL, e.g. `http://localhost:4000` |
| `NEXT_PUBLIC_SITE_URL` | Website URL, e.g. `http://localhost:3000` |
| `WHATSAPP_NUMBER` | Same as the API |

`.env` files are git-ignored. Never commit them.

## Before going live

1. **Host the API in the same region as the database** (Neon is in AWS Frankfurt, so pick Frankfurt / `eu-central`
   on Render, Railway or Fly). From Nigeria each database round trip is ~0.5 s; next to the database it's milliseconds.
2. Add `&connect_timeout=15` to the end of `DATABASE_URL` and `DIRECT_URL`. Neon's free tier sleeps when idle and the
   first connection can take longer than Prisma's 5 s default.
3. Set production env vars:
   - API: `WEB_ORIGIN=https://your-domain` (CORS), real `JWT_SECRET`, Cloudinary keys, `WHATSAPP_NUMBER`
   - Web: `NEXT_PUBLIC_API_URL=https://your-api-domain`, `NEXT_PUBLIC_SITE_URL=https://your-domain`
     (used for canonical URLs, share links, `sitemap.xml` and `robots.txt`; wrong value = broken SEO)
4. Run `npx prisma migrate deploy` and `npm run seed` against the production database.
5. After launch, add the site to [Google Search Console](https://search.google.com/search-console) and submit
   `https://your-domain/sitemap.xml`.
6. Rotate any keys that were ever pasted into chats or screenshots (Cloudinary API secret, admin password).

Testimonials: there is no admin screen for reviews yet. Add them in Prisma Studio and set `approved = true`.

## Useful commands

```powershell
cd api
npx prisma studio        # browse/edit data (e.g. approve reviews)
npm run seed             # re-run seed (safe; resets admin password to the one in .env)
npx prisma migrate dev   # after changing prisma/schema.prisma
```
