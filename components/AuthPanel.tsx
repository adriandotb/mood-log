"use client";
import React from 'react';
import { supabase } from '../lib.supabase';

interface SessionUser {
  id: string;
  email?: string;
}

export function AuthPanel({ onAuth }: { onAuth?: (user: SessionUser | null) => void }) {
  const [email, setEmail] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<SessionUser | null>(null);

  React.useEffect(() => {
    let ignore = false;
    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!ignore) {
        setUser(data.user ? { id: data.user.id, email: data.user.email ?? undefined } : null);
        onAuth?.(data.user ? { id: data.user.id, email: data.user.email ?? undefined } : null);
      }
    }
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ? { id: session.user.id, email: session.user.email ?? undefined } : null;
      setUser(u);
      onAuth?.(u);
    });
    return () => {
      ignore = true;
      sub.subscription.unsubscribe();
    };
  }, [onAuth]);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href } });
      if (error) throw error;
      setMessage('Check your email for a sign-in link.');
      setEmail('');
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setSending(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  if (user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-slate-400">Signed in as <span className="text-slate-200 font-medium">{user.email}</span></span>
        <button
          type="button"
          onClick={signOut}
          className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs"
        >Sign out</button>
      </div>
    );
  }

  return (
    <form onSubmit={sendMagicLink} className="flex flex-wrap items-end gap-2 text-sm">
      <div className="flex flex-col">
        <label className="text-xs font-medium text-slate-400 uppercase mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <button
        type="submit"
        disabled={sending}
        className="h-10 px-4 rounded bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-medium"
      >{sending ? 'Sending…' : 'Send Link'}</button>
      {message && <span className="text-xs text-slate-400 w-full">{message}</span>}
    </form>
  );
}
