# Supabase Setup

This project now supports Supabase in two ways:

- Prisma uses Supabase Postgres as the application database.
- `lib/supabase/*` provides browser, server, and admin clients for Supabase APIs.
- Vercel deployment is documented in `docs/vercel-setup.md`.

## 1. Add environment variables

Copy the values from your Supabase project into `.env`:

```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
```

Use the pooled connection string for `DATABASE_URL` and the direct connection string for `DIRECT_URL`.

## 2. Create the schema in Supabase

The existing Prisma migrations in `prisma/migrations` were generated for MySQL, so do not run `prisma migrate deploy` against a fresh Supabase database.

For a fresh Supabase project, initialize the schema with:

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

## 3. Use the Supabase clients

- Browser code: `createSupabaseBrowserClient()` from `lib/supabase/client.ts`
- Server code: `createSupabaseServerClient()` from `lib/supabase/server.ts`
- Privileged server code: `createSupabaseAdminClient()` from `lib/supabase/admin.ts`

Keep using Prisma for the app's existing database queries unless you intentionally want to move a feature over to Supabase's client APIs.
