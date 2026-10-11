
'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (busy) return;

    setBusy(true);
    setError('');

    try {
      const supabase = supabaseBrowser();

      const { data, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (authError) {
        console.error('Supabase sign-in error:', authError.message);

        if (authError.message === 'Invalid login credentials') {
          setError('ইমেইল বা পাসওয়ার্ড সঠিক নয়। Supabase Auth User ও Password যাচাই করো।');
        } else {
          setError('লগইন ব্যর্থ হয়েছে। Browser Console-এ Error পরীক্ষা করো।');
        }

        return;
      }

      if (!data.user) {
        setError('লগইন সম্পন্ন হয়নি। আবার চেষ্টা করো।');
        return;
      }

      if (
        data.user.email?.trim().toLowerCase() !==
        'khalidmutasimsaad@gmail.com'
      ) {
        await supabase.auth.signOut();
        setError('এই ইমেইলটি Admin হিসেবে অনুমোদিত নয়।');
        return;
      }

      router.push('/admin/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Admin login exception:', err);
      setError(
        'সংযোগ বা JavaScript সমস্যার কারণে লগইন করা যায়নি। Console পরীক্ষা করো।'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="container section">
      <div className="card mx-auto max-w-md p-7">
        <p className="font-bold text-rose">শুধু দোকান মালিকের জন্য</p>

        <h1 className="mt-2 text-3xl font-bold">Admin Login</h1>

        <p className="mt-2 text-sm text-stone-500">
          কাস্টমারদের কোনো লগইন নেই।
        </p>

        <form className="mt-6 grid gap-4" onSubmit={submit}>
          <label className="grid gap-1 font-semibold" htmlFor="admin-email">
            Admin email
            <input
              id="admin-email"
              name="email"
              className="field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </label>

          <label className="grid gap-1 font-semibold" htmlFor="admin-password">
            Password
            <input
              id="admin-password"
              name="password"
              className="field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}

          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'প্রবেশ করা হচ্ছে...' : 'লগইন'}
          </button>
        </form>
      </div>
    </section>
  );
}
