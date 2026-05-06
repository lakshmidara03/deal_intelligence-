'use client';

import { useMutation } from '@tanstack/react-query';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const setAccount = useAuthStore((state) => state.setAccount);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(mode === 'login' ? 'admin@dealpoc.com' : '');
  const [password, setPassword] = useState(mode === 'login' ? 'admin123' : '');
  const [title, setTitle] = useState('Account Executive');
  const [role, setRole] = useState<'ADMIN' | 'EMPLOYEE'>('EMPLOYEE');

  const mutation = useMutation({
    mutationFn: () =>
      mode === 'login'
        ? api.login({ email, password })
        : api.signup({
            name,
            email,
            password,
            title,
            role
          }),
    onSuccess: (account) => {
      setAccount(account);
      router.push(account.role === 'ADMIN' ? '/admin' : '/');
    }
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-6 py-10">
      <form className="w-full max-w-md rounded-md border border-line bg-white p-6" onSubmit={handleSubmit}>
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-ink text-white">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-ink">{mode === 'login' ? 'Login' : 'Create Account'}</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          {mode === 'login'
            ? 'Use a demo account to view assigned deals or the admin dashboard.'
            : 'Create a POC account for an employee or admin user.'}
        </p>

        <div className="mt-6 space-y-4">
          {mode === 'signup' && (
            <>
              <label className="block text-sm font-medium text-ink">
                Name
                <input
                  className="mt-2 h-10 w-full rounded-md border border-line px-3 outline-none focus:border-ink"
                  onChange={(event) => setName(event.target.value)}
                  required
                  value={name}
                />
              </label>
              <label className="block text-sm font-medium text-ink">
                Title
                <input
                  className="mt-2 h-10 w-full rounded-md border border-line px-3 outline-none focus:border-ink"
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  value={title}
                />
              </label>
              <label className="block text-sm font-medium text-ink">
                Role
                <select
                  className="mt-2 h-10 w-full rounded-md border border-line px-3 outline-none focus:border-ink"
                  onChange={(event) => setRole(event.target.value as 'ADMIN' | 'EMPLOYEE')}
                  value={role}
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </label>
            </>
          )}

          <label className="block text-sm font-medium text-ink">
            Email
            <input
              className="mt-2 h-10 w-full rounded-md border border-line px-3 outline-none focus:border-ink"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            Password
            <input
              className="mt-2 h-10 w-full rounded-md border border-line px-3 outline-none focus:border-ink"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
        </div>

        {mode === 'login' && (
          <div className="mt-4 rounded-md border border-line bg-paper p-3 text-xs leading-5 text-zinc-600">
            Admin: admin@dealpoc.com / admin123
            <br />
            Employee: priya@dealpoc.com / employee123
          </div>
        )}

        {mutation.isError && <p className="mt-4 text-sm font-medium text-red-700">Could not complete this request.</p>}

        <button
          className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-ink px-3 text-sm font-semibold text-white hover:bg-zinc-700"
          type="submit"
        >
          {mode === 'login' ? 'Login' : 'Sign Up'}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>

        <p className="mt-4 text-center text-sm text-zinc-600">
          {mode === 'login' ? (
            <Link className="font-semibold text-ink hover:underline" href="/signup">
              Create a new account
            </Link>
          ) : (
            <Link className="font-semibold text-ink hover:underline" href="/login">
              Back to login
            </Link>
          )}
        </p>
      </form>
    </main>
  );
}
