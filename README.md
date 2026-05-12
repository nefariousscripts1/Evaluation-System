# Digital Evaluation System

A full-stack web application for faculty evaluation in a university environment.

## Features

- Role-based access control (student, faculty, chairperson, dean, director, campus_director, admin)
- Hierarchical evaluation flow
- Dynamic questionnaire management
- Evaluation schedule control
- Results with charts and filters

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM
- NextAuth.js (Credentials provider)
- MySQL / PostgreSQL

## Getting Started

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your local values.
4. Generate the Prisma client and start the app:
   ```bash
   npm run db:generate
   npm run dev
   ```

## Railway Deployment

This repo already includes [`railway.json`](./railway.json) and Railway-specific scripts:

- `npm run railway:build`
- `npm run railway:start`

To connect it to Railway:

1. Create a Railway project.
2. Add this repo as a service.
3. Add a MySQL service in the same Railway project.
4. Set `DATABASE_URL` on the app service to the MySQL connection string or Railway variable reference for that database.
5. Set `NEXTAUTH_SECRET` to a long random secret.
6. Optionally set `AUTH_SECRET` to `${{NEXTAUTH_SECRET}}`.
7. Generate a public domain for the app service in Railway.

Notes:

- The app now detects Railway's `RAILWAY_PUBLIC_DOMAIN` automatically, so `NEXTAUTH_URL` and `AUTH_URL` do not need to be hardcoded for Railway deployments.
- On startup, the Railway start command runs `prisma migrate deploy` before `next start`, so committed Prisma migrations will be applied automatically.

## Vercel Deployment

This app is also ready for Vercel deployment.

Relevant behavior:

- Auth URL detection already supports `VERCEL_PROJECT_PRODUCTION_URL` and `VERCEL_URL`.
- The repo now includes a `vercel-build` script that runs Prisma generation, applies migrations, and builds the app.

To connect it to Vercel:

1. Import this repository into Vercel.
2. In Project Settings -> Build and Deployment, set the Build Command to `npm run vercel-build`.
3. Set `DATABASE_URL` in Vercel Project Settings -> Environment Variables.
4. Set `NEXTAUTH_SECRET` in the same place.
5. Optionally set `AUTH_SECRET` to the same value as `NEXTAUTH_SECRET`.
6. Redeploy the project after saving the variables.

Notes:

- `NEXTAUTH_URL` and `AUTH_URL` are usually not required on Vercel because the app derives a base URL from Vercel system environment variables.
- For preview deployments, consider using a separate preview database so preview migrations do not affect production.
