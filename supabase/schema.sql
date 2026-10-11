create extension if not exists pgcrypto;
create type public.order_status as enum ('pending','confirmed','shipped','delivered','cancelled');
create table public.categories(id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique, description text default '', sort_order int not null default 0, created_at timestamptz not null default now());
create table public.products(id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique, description text not null default '', price numeric(12,2) not null check(price>=0), discount_percent int not null default 0 check(discount_percent between 0 and 90), stock int not null default 0 check(stock>=0), category_id uuid references public.categories(id) on delete set null, images text[] not null default '{}', is_published boolean not null default false, is_featured boolean not null default false, is_best_seller boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.orders(id uuid primary key default gen_random_uuid(), order_number text not null unique, idempotency_key text not null unique, customer_name text not null, phone text not null, address text not null, district text not null, area text not null, note text not null default '', payment_method text not null check(payment_method in ('cod','bkash','nagad')), transaction_id text not null default '', status public.order_status not null default 'pending', subtotal numeric(12,2) not null check(subtotal>=0), delivery_charge numeric(12,2) not null check(delivery_charge>=0), total numeric(12,2) not null check(total=subtotal+delivery_charge), items jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.reviews(id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade, name text not null, rating int not null check(rating between 1 and 5), comment text not null default '', approved boolean not null default false, created_at timestamptz not null default now());
create table public.shop_settings(id int primary key default 1 check(id=1), shop_name text not null default 'Saad''s Corner', phone text not null default '+8801750082383', email text not null default 'khalidmutasimsaad@gmail.com', rajshahi_delivery numeric(10,2) not null default 0, other_delivery numeric(10,2) not null default 120, bkash_enabled boolean not null default false, nagad_enabled boolean not null default false, bkash_number text not null default '', nagad_number text not null default '', announcement text not null default 'রাজশাহীতে ফ্রি ডেলিভারি 🎉', hero_image text not null default '', updated_at timestamptz not null default now());
insert into public.shop_settings(id) values(1) on conflict do nothing;
create index products_published_idx on public.products(is_published,created_at desc);
create index products_category_idx on public.products(category_id);
create index orders_phone_number_idx on public.orders(phone,order_number);
create index orders_created_idx on public.orders(created_at desc);
create index reviews_approved_idx on public.reviews(approved,created_at desc);

alter table public.categories enable row level security; alter table public.products enable row level security; alter table public.orders enable row level security; alter table public.reviews enable row level security; alter table public.shop_settings enable row level security;
create policy "public reads categories" on public.categories for select to anon, authenticated using (true);
create policy "public reads published products" on public.products for select to anon, authenticated using (is_published=true);
create policy "public reads approved reviews" on public.reviews for select to anon, authenticated using (approved=true);
-- Orders and reviews are created only through validated server endpoints using the service role.
-- Do not grant anon direct insert/select privileges on orders. Admin routes verify ADMIN_EMAIL.
revoke all on public.orders from anon, authenticated;
revoke insert, update, delete on public.products from anon, authenticated;
revoke insert, update, delete on public.categories from anon, authenticated;
revoke insert, update, delete on public.reviews from anon, authenticated;
revoke all on public.shop_settings from anon, authenticated;
-- Authenticated RLS policies are intentionally not used for admin writes: server endpoints gate by allowlisted admin identity.
-- Storage: product-media is public for image delivery; upload is performed by authenticated server admin routes only.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('product-media','product-media',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy "public view product media" on storage.objects for select to anon, authenticated using(bucket_id='product-media');
-- No anon insert/update/delete policies for storage.objects.
