This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deploy on Netlify

1. Push this repo to GitHub.
2. Netlify → Add new site → Import from Git.
3. Build settings:
   - Base directory: `proposal-generator-app` (only if your repo root is the parent folder)
   - Build command: `npm run build`
   - Publish directory: leave empty (the Netlify Next plugin handles this)
4. Add environment variables in Netlify:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   - STRIPE_SECRET_KEY
   - STRIPE_WEBHOOK_SECRET
   - ANTHROPIC_API_KEY
   - ANTHROPIC_MODEL
   - NEXT_PUBLIC_APP_URL
5. Deploy the site.
6. Update external services:
   - Supabase Auth Redirect URLs: `https://YOUR_SITE.netlify.app/auth/callback`
   - Stripe Webhook endpoint: `https://YOUR_SITE.netlify.app/api/stripe/webhook`

## Approved Signup Flow

1. Create the `signup_requests` table in Supabase:

```
create table if not exists signup_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  email text not null,
  status text not null default 'pending' check (status in ('pending','approved','denied')),
  approved_at timestamptz,
  denied_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table signup_requests enable row level security;
create policy "Users can view their signup request"
  on signup_requests for select
  using (auth.uid() = user_id);
```

2. Configure SMTP environment variables:
   - SMTP_HOST
   - SMTP_PORT
   - SMTP_USER
   - SMTP_PASS
   - SMTP_FROM

3. Update `src/lib/allowed-users.ts` to the admin emails who can approve requests.
