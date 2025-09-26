"use client";
import React from 'react';
import { supabase } from '../../lib.supabase';

interface EntrySlice { period: string; mood: number; energy: number; anxiety: number }
interface Entry { id: string; date: string; slices: EntrySlice[] }

function MiniSpark({ values, color }: { values: number[]; color: string }) {
  if (!values.length) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 100 - ((v - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 100 100" className="w-24 h-6">
      <polyline fill="none" stroke={color} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" points={points} />
    </svg>
  );
}

export default function HistoryPage() {
  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUserId(session?.user?.id ?? null);
    });
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  React.useEffect(() => {
    if (!userId) { setEntries([]); setLoading(false); return; }
    let active = true;
    async function load() {
      setLoading(true); setError(null);
      const { data, error } = await supabase.from('mood_entries').select('id,date,slices').eq('user_id', userId).order('date', { ascending: false }).limit(60);
      if (!active) return;
      if (error) setError(error.message); else setEntries(data as any);
      setLoading(false);
    }
    load();
  }, [userId]);

  const flattened = entries.map(e => {
    const avg = (metric: 'mood'|'energy'|'anxiety') => {
      const nums = e.slices.map(s => s[metric]).filter(n => typeof n === 'number');
      return nums.length ? (nums.reduce((a,b)=>a+b,0)/nums.length) : null;
    };
    return { date: e.date, mood: avg('mood'), energy: avg('energy'), anxiety: avg('anxiety') };
  });

  const moodVals = flattened.map(f => (f.mood ?? 0));
  const energyVals = flattened.map(f => (f.energy ?? 0));
  const anxietyVals = flattened.map(f => (f.anxiety ?? 0));

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-slate-100">History</h1>
        <a href="/" className="text-xs text-brand-400 hover:text-brand-300 underline">Back to Entry</a>
      </header>
      {!userId && <div className="text-sm text-slate-400">Sign in to view your history.</div>}
      {userId && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-6 items-end">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wide text-slate-500">Mood Trend</span>
              <MiniSpark values={[...moodVals].reverse()} color="#6366f1" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wide text-slate-500">Energy Trend</span>
              <MiniSpark values={[...energyVals].reverse()} color="#06b6d4" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wide text-slate-500">Anxiety Trend</span>
              <MiniSpark values={[...anxietyVals].reverse()} color="#ec4899" />
            </div>
          </div>
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-800/50 text-slate-300 text-xs uppercase tracking-wide">
                  <th className="p-2 text-left font-medium">Date</th>
                  <th className="p-2 text-center font-medium">Mood (avg)</th>
                  <th className="p-2 text-center font-medium">Energy (avg)</th>
                  <th className="p-2 text-center font-medium">Anxiety (avg)</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={4} className="p-4 text-center text-slate-400">Loading...</td></tr>
                )}
                {!loading && !entries.length && (
                  <tr><td colSpan={4} className="p-4 text-center text-slate-500">No entries yet.</td></tr>
                )}
                {!loading && entries.map(e => {
                  const f = flattened.find(f => f.date === e.date)!;
                  return (
                    <tr key={e.id} className="border-t border-slate-800 hover:bg-slate-800/30">
                      <td className="p-2 font-mono text-xs sm:text-sm text-slate-300 whitespace-nowrap">{e.date}</td>
                      <td className="p-2 text-center text-slate-200">{f.mood?.toFixed(1) ?? '—'}</td>
                      <td className="p-2 text-center text-slate-200">{f.energy?.toFixed(1) ?? '—'}</td>
                      <td className="p-2 text-center text-slate-200">{f.anxiety?.toFixed(1) ?? '—'}</td>
                    </tr>
                  );
                })}
                {error && <tr><td colSpan={4} className="p-4 text-center text-red-400">{error}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
