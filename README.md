# Saad's Corner — Next.js + Supabase

A Bengali-first, mobile-first guest checkout storefront for Bangladesh. There are no customer accounts. Admin access uses Supabase Auth and is allowlisted to `ADMIN_EMAIL` on every admin API route.

## Important before launch

This repository is a substantial deployable foundation, **not a certified production-ready commerce system** until you configure credentials and complete the tests below. It does not integrate a payment gateway; bKash/Nagad are manual payments only. The dashboard currently supports order management, product creation/deletion, reviews, customer summary, and shop settings. Full existing-product editing, category management UI, and upload integration in the product form are not complete. The upload API exists at `/api/admin/upload`.

## Local setup

1. Install Node.js 20 LTS and Git.
2. Copy `.env.example` to `.env.local` and fill in Supabase URL, anon key, service-role key, admin email, Resend key, verified sender, and site URL.
3. In Supabase SQL Editor, run `supabase/schema.sql`.
4. In Supabase → Authentication → Users, create the admin user using the exact `ADMIN_EMAIL` and a strong password. Disable public signups in Auth settings. Keep the service-role key server-side only.
5. Run `npm install`, then `npm run dev` and open `http://localhost:3000`.
6. Visit `/admin/login`; add real products before launch. Product image fields accept public image URLs from the `product-media` bucket.

## Deploy with GitHub and Vercel

1. Create a private GitHub repository. In this directory run:
   ```bash
   git init
   git add .
   git commit -m "Initial Saad's Corner store"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```
2. In Vercel, choose **Add New → Project**, import the GitHub repository, keep the Next.js preset, and add every variable from `.env.example` in Project Settings → Environment Variables. `SUPABASE_SERVICE_ROLE_KEY` must never use a `NEXT_PUBLIC_` prefix.
3. Deploy. Pushes to the configured production branch trigger automatic deployments.
4. For a custom domain, add it in Vercel → Project → Settings → Domains and apply the DNS records Vercel provides. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS domain and redeploy.
5. Configure Supabase Auth Site URL and allowed redirect URLs for the production domain. Verify your sender domain in Resend and set `ORDER_NOTIFICATION_FROM` to that verified sender.

## Security and operational notes

- Server routes validate order payloads and re-price every product from the database. Do not expose `SUPABASE_SERVICE_ROLE_KEY` to client code.
- Public order lookup requires both order number and phone number and only returns limited order fields.
- Public reviews are pending approval by default.
- The included process-local order throttle is a basic fallback and is not distributed across Vercel instances. Before a high-traffic launch, replace it with managed rate limiting (e.g. Upstash Redis) and add CAPTCHA/Turnstile.
- For strict inventory correctness, replace the multi-step stock decrement with a PostgreSQL RPC transaction that locks product rows, validates stock, inserts the order, and decrements inventory atomically. Test concurrent checkouts before launch.
- Add backups, error monitoring, privacy policy, and recovery tests before accepting real orders.

## Routes

- `/`, `/shop`, `/product/[slug]`, `/cart`, `/checkout`
- `/order-success/[id]`, `/track`, `/about`, `/contact`, `/delivery-policy`, `/return-policy`
- `/admin/login`, `/admin/dashboard`, `/admin/invoice/[id]`
- `/api/orders`, `/api/track`, `/api/reviews`, `/api/admin/*`

## Supabase RLS

Run `supabase/schema.sql` once in a new project. Admin API requests authenticate the Supabase user and check their email against `ADMIN_EMAIL`; never rely on hiding the admin route alone. The service-role client exists only in server modules. Public order creation and tracking happen through server endpoints; order table direct anonymous access is revoked.
