X`X# Hotel Reservation and Management System

Full-stack hotel/apartment booking platform built with Next.js, PostgreSQL, Prisma, NextAuth, Stripe, and AWS S3.

## Features

- Public booking flow with Stripe Checkout
- Availability checks with date overlap protection
- Dashboard for admin/worker:
  - Overview
  - Rooms
  - Reservations
  - Payments and Invoices
  - Reports
  - Expenses
  - Users
  - Manage Rooms
  - Activity Logs
  - Permissions
- Role-based access (`admin`, `worker`, `client`)
- Email/password + Google login
- Email verification flow (register + resend verification)
- Room images upload to S3
- Reservation receipts (print / PDF)
- Responsive UI for desktop and mobile

## Tech Stack

- Next.js (App Router)
- React
- Material UI + Tailwind CSS
- Prisma ORM
- PostgreSQL
- NextAuth
- Stripe
- AWS S3

## Project Structure

- `src/app` - pages, API routes, app layout
- `src/app/components` - dashboard and public UI components
- `src/lib` - shared logic/helpers
- `prisma/schema.prisma` - Prisma models

## Requirements

- Node.js 18+
- PostgreSQL 14+
- npm

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` in project root.

3. Configure database and generate Prisma client:

```bash
npx prisma generate
```

If your DB schema already exists and is DB-first:

```bash
npx prisma db pull
```

If you want Prisma to push schema changes:

```bash
npx prisma db push
```

4. Run dev server:

```bash
npm run dev
```

5. Build check:

```bash
npm run build
```

## Environment Variables

Set these in `.env` (local) and Vercel Project Settings (production):

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_BASE_URL`
- `AWS_REGION`
- `AWS_S3_BUCKET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## Stripe Setup

### Checkout API

`/api/create-checkout-session` expects valid:

- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_BASE_URL` (must include `https://` in production)

### Webhook

Create Stripe webhook destination:

- `https://<your-domain>/api/stripe-webhook`

Subscribe at least to:

- `checkout.session.completed`

Set `STRIPE_WEBHOOK_SECRET` from Stripe endpoint signing secret.

## Google OAuth Setup

In Google Cloud Console OAuth client:

- Authorized redirect URI:
  - `https://<your-domain>/api/auth/callback/google`
  - `http://localhost:3000/api/auth/callback/google` (local)

In Vercel:

- `NEXTAUTH_URL=https://<your-domain>`
- Correct `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

## Deployment (Vercel + Neon)

1. Push code to GitHub (`main` branch).
2. Import repo to Vercel.
3. Add all env vars in Vercel.
4. Use cloud Postgres (Neon/Supabase) for `DATABASE_URL`.
5. Deploy and verify:
   - login (credentials + Google)
   - booking checkout
   - webhook updates reservation
   - dashboard tabs load correctly

## Common Issues

### `redirect_uri_mismatch` (Google)

- Redirect URI in Google must match exactly:
  - `https://<domain>/api/auth/callback/google`
- Ensure `NEXTAUTH_URL` uses same domain.

### Stripe `url_invalid` for `success_url`

- `NEXT_PUBLIC_BASE_URL` is missing or invalid.
- Must be full URL with scheme, for example:
  - `https://hotel-dijaripremium.vercel.app`

### Build error with `useSearchParams` in `/dashboard`

- Dashboard page uses a `Suspense` wrapper around component using `useSearchParams`.
- Keep that pattern if you refactor the page.

## Security Notes

- Never commit `.env`
- Rotate exposed API keys immediately
- Use separate test/live Stripe keys
- Restrict cloud DB and S3 credentials

## Scripts

- `npm run dev` - local development
- `npm run build` - production build
- `npm start` - run production server (after build)

## License

Private project unless specified otherwise by repository owner.
