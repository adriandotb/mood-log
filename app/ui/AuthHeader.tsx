"use client";
import React from 'react';
import { supabase } from '../../lib.supabase';

interface SessionUser { id: string; email?: string }

export default function AuthHeader() {
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, email: data.user.email ?? undefined });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ? { id: session.user.id, email: session.user.email ?? undefined } : null;
      setUser(u);
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setInfo(null);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo('Account created.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      setPassword('');
      setOpen(false);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }

  function close() { setOpen(false); setError(null); setInfo(null); }

  async function signOut() { await supabase.auth.signOut(); }

  return (
    <>
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold tracking-tight">Mood Tracker</h1>
          <p className="text-sm text-slate-400">Capture how you feel today in under a minute.</p>
        </div>
        <nav className="flex items-center gap-3 text-xs">
          <a href="/" className="text-slate-300 hover:text-white">Entry</a>
          <a href="/history" className="text-slate-300 hover:text-white">History</a>
          {user ? (
            <>
              <span className="hidden sm:inline text-slate-400">{user.email}</span>
              <button onClick={signOut} className="rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 px-3 py-1 text-slate-200">Log out</button>
            </>
          ) : (
            <>
              <button onClick={() => { setMode('signin'); setOpen(true); }} className="rounded bg-brand-500 hover:bg-brand-600 text-white px-3 py-1">Sign In</button>
              <button onClick={() => { setMode('signup'); setOpen(true); }} className="rounded border border-brand-500 text-brand-300 hover:bg-brand-500/10 px-3 py-1">Sign Up</button>
            </>
          )}
        </nav>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
          <div className="relative z-10 w-full max-w-sm rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100">{mode === 'signin' ? 'Sign In' : 'Create Account'}</h2>
              <button onClick={close} className="text-slate-400 hover:text-slate-200" aria-label="Close">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] uppercase tracking-wide text-slate-400">Email</label>
                <input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] uppercase tracking-wide text-slate-400">Password</label>
                <input type="password" required autoComplete={mode==='signin'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} className="rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              {error && <div className="text-xs text-red-400">{error}</div>}
              {info && <div className="text-xs text-green-400">{info}</div>}
              <div className="flex items-center justify-between gap-4 pt-2">
                <button type="submit" disabled={loading} className="rounded bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 text-sm font-medium">
                  {loading ? (mode==='signin'?'Signing in...':'Creating...') : (mode==='signin'?'Sign In':'Create Account')}
                </button>
                <button type="button" onClick={() => setMode(mode==='signin'?'signup':'signin')} className="text-xs text-brand-300 hover:text-brand-200 underline">
                  {mode==='signin' ? 'Need an account? Sign Up' : 'Have an account? Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
