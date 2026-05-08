# Vercel Setup

This app can be deployed on Vercel with Supabase as the database.

## 1. Import the project into Vercel

Create a new Vercel project and import this repository.

Use the default framework detection for Next.js.

## 2. Add environment variables in Vercel

In your Vercel project settings, add these variables:

```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
NEXTAUTH_SECRET="your-random-secret"
NEXTAUTH_URL="https://your-domain.vercel.app"
AUTH_URL="https://your-domain.vercel.app"
RESEND_API_KEY="your-resend-key"
EMAIL_FROM="Digital Evaluation System <noreply@example.com>"
GMAIL_USER="your-email@example.com"
GMAIL_APP_PASSWORD="your-app-password"
```

If you later attach a custom domain, update `NEXTAUTH_URL` and `AUTH_URL` to that exact `https://` URL.

## 3. Build behavior

No special Vercel build command is required.

`postinstall` already runs `prisma generate`, so the default Vercel build is enough for the app code.

## 4. Initialize the Supabase database

Do not rely on Vercel to create the database schema during build.

Because the existing migration history was created for MySQL, initialize a fresh Supabase database from your local machine with:

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

## 5. Auth URL fallback

If `NEXTAUTH_URL` or `AUTH_URL` is not set, the app can also fall back to Vercel-provided environment variables such as `VERCEL_PROJECT_PRODUCTION_URL` and `VERCEL_URL`.
