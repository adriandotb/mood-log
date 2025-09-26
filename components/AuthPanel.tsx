"use client";
import React from 'react';
import { supabase } from '../lib.supabase';

interface SessionUser { id: string; email?: string }

export function AuthPanel({ onAuth }: { onAuth?: (user: SessionUser | null) => void }) {
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [mode, setMode] = React.useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);

  React.useEffect(() => {
    let ignore = false;
    async function init() {
      const { data } = await supabase.auth.getUser();
      if (!ignore) {
        const u = data.user ? { id: data.user.id, email: data.user.email ?? undefined } : null;
        setUser(u);
        onAuth?.(u);
      }
    }
    init();
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      const u = session?.user ? { id: session.user.id, email: session.user.email ?? undefined } : null;
      setUser(u);
      onAuth?.(u);
    });
    return () => { ignore = true; sub.subscription.unsubscribe(); };
  }, [onAuth]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setInfo(null);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo('Account created. You are signed in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      setPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function signOut() { await supabase.auth.signOut(); }

  if (user) {
    return (
      <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
        <span className="text-slate-400">Signed in as <span className="text-slate-200 font-medium">{user.email}</span></span>
        <button type="button" onClick={signOut} className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-[11px] sm:text-xs">Sign out</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 text-xs sm:text-sm w-full max-w-xs">
      <div className="flex gap-2 mb-1">
        <button type="button" onClick={() => setMode('signin')} className={`flex-1 rounded py-1 text-center border ${mode==='signin' ? 'bg-brand-600 text-white border-brand-500' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}>Sign In</button>
        <button type="button" onClick={() => setMode('signup')} className={`flex-1 rounded py-1 text-center border ${mode==='signup' ? 'bg-brand-600 text-white border-brand-500' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}>Sign Up</button>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] tracking-wide uppercase text-slate-400">Email</span>
        <input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] tracking-wide uppercase text-slate-400">Password</span>
        <input type="password" required autoComplete={mode==='signin' ? 'current-password' : 'new-password'} value={password} onChange={e=>setPassword(e.target.value)} className="rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </label>
      <button type="submit" disabled={loading} className="mt-1 rounded bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-3 py-2 text-xs font-medium">
        {loading ? (mode==='signin' ? 'Signing in...' : 'Creating...') : (mode==='signin' ? 'Sign In' : 'Create Account')}
      </button>
      {error && <div className="text-[11px] text-red-400">{error}</div>}
      {info && <div className="text-[11px] text-green-400">{info}</div>}
    </form>
  );
}
