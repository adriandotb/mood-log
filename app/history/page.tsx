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

function LineChart({ days }: { days: { date: string; mood: number|null; energy: number|null; anxiety: number|null }[] }) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = React.useState(600);
  React.useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        setWidth(Math.max(320, w));
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);
  const data = days.filter(d => d.mood !== null || d.energy !== null || d.anxiety !== null);
  if (data.length < 2) return <div className="text-xs text-slate-500">More days needed for trend chart.</div>;
  const height = 160;
  const pad = 24;
  const metrics: { key: 'mood'|'energy'|'anxiety'; color: string; label: string }[] = [
    { key: 'mood', color: '#6366f1', label: 'Mood' },
    { key: 'energy', color: '#06b6d4', label: 'Energy' },
    { key: 'anxiety', color: '#ec4899', label: 'Anxiety' },
  ];
  const xFor = (i: number) => pad + (i/(data.length-1))*(width - pad*2);
  const yForVal = (v: number) => {
    // scale 1-10 -> invert y
    const clamped = Math.min(10, Math.max(1, v));
    const ratio = (clamped - 1) / 9; // 0..1
    return pad + (1 - ratio) * (height - pad*2);
  };
  function makePath(key: 'mood'|'energy'|'anxiety') {
    let d = '';
    data.forEach((pt, i) => {
      const val = pt[key];
      if (val == null) return;
      const x = xFor(i);
      const y = yForVal(val);
      d += (d ? ' L' : 'M') + x + ' ' + y;
    });
    return d;
  }
  const yTicks = [1,3,5,7,9,10];
  return (
    <div ref={containerRef} className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 select-none">
        <rect x={0} y={0} width={width} height={height} fill="none" />
        {yTicks.map(t => {
          const y = yForVal(t);
          return <g key={t}>
            <line x1={pad} x2={width-pad} y1={y} y2={y} stroke="#1e293b" strokeDasharray="2 4" />
            <text x={4} y={y+4} fontSize={10} fill="#64748b">{t}</text>
          </g>;
        })}
        {metrics.map(m => (
          <path key={m.key} d={makePath(m.key)} stroke={m.color} fill="none" strokeWidth={3} strokeLinecap="round" />
        ))}
        {data.map((pt,i) => {
          const x = xFor(i);
          return (
            <g key={pt.date}>
              <line x1={x} x2={x} y1={pad} y2={height-pad} stroke="#1e293b" strokeDasharray="1 8" />
              {i % Math.max(1, Math.floor(data.length/10)) === 0 && (
                <text x={x} y={height-4} fontSize={10} fill="#64748b" textAnchor="middle">{pt.date.slice(5)}</text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex gap-4 pt-2 flex-wrap text-xs">
        {metrics.map(m => (
          <div key={m.key} className="flex items-center gap-1 text-slate-300">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: m.color }} /> {m.label}
          </div>
        ))}
      </div>
    </div>
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

  const [expanded, setExpanded] = React.useState<string | null>(null);

  // Summary stats (last 7 days vs previous 7 if available)
  // Last 7 calendar days (including today) even if missing entries
  const today = new Date();
  function fmt(d: Date) { return d.toISOString().slice(0,10); }
  const last7Dates: string[] = Array.from({ length: 7 }).map((_,i) => {
    const dt = new Date(today);
    dt.setDate(today.getDate() - (6 - i));
    return fmt(dt);
  });
  const prev7Dates: string[] = Array.from({ length: 7 }).map((_,i) => {
    const dt = new Date(today);
    dt.setDate(today.getDate() - 7 - (6 - i));
    return fmt(dt);
  });
  const mapByDate = Object.fromEntries(flattened.map(f => [f.date, f] as const));
  const last7 = last7Dates.map(d => mapByDate[d] || { date: d, mood: null, energy: null, anxiety: null });
  const prev7 = prev7Dates.map(d => mapByDate[d] || { date: d, mood: null, energy: null, anxiety: null });
  function avgMetric(arr: { mood: number|null, energy: number|null, anxiety: number|null }[], key: 'mood'|'energy'|'anxiety') {
    const nums = arr.map(d => d[key]).filter((v): v is number => typeof v === 'number');
    return nums.length ? nums.reduce((a,b)=>a+b,0)/nums.length : null;
  }
  const last7Avg = {
    mood: avgMetric(last7, 'mood'),
    energy: avgMetric(last7, 'energy'),
    anxiety: avgMetric(last7, 'anxiety'),
  };
  const prev7Avg = {
    mood: avgMetric(prev7, 'mood'),
    energy: avgMetric(prev7, 'energy'),
    anxiety: avgMetric(prev7, 'anxiety'),
  };
  function delta(curr: number|null, prev: number|null) {
    if (curr==null || prev==null) return null;
    const d = curr - prev;
    return d;
  }
  const deltas = {
    mood: delta(last7Avg.mood, prev7Avg.mood),
    energy: delta(last7Avg.energy, prev7Avg.energy),
    anxiety: delta(last7Avg.anxiety, prev7Avg.anxiety),
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-slate-100">History</h1>
        <p className="text-xs text-slate-500">Daily progression & trends</p>
      </header>
      {!userId && <div className="text-sm text-slate-400">Sign in to view your history.</div>}
      {userId && (
        <div className="space-y-6">
          <section className="space-y-4">
            <h2 className="text-sm font-semibold tracking-wide text-slate-300 uppercase">Daily Averages Chart</h2>
            <LineChart days={[...flattened].reverse()} />
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-wide text-slate-300 uppercase">7-Day Summary</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {(['mood','energy','anxiety'] as const).map(k => {
                const label = k.charAt(0).toUpperCase()+k.slice(1);
                const curr = (last7Avg as any)[k];
                const change = (deltas as any)[k];
                const colorMap: any = { mood:'#6366f1', energy:'#06b6d4', anxiety:'#ec4899' };
                return (
                  <div key={k} className="rounded-md border border-slate-800 bg-slate-900/40 p-3 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: colorMap[k] }} />
                      <span className="font-medium text-slate-200">{label}</span>
                    </div>
                    <div className="text-slate-300 text-sm">{curr?.toFixed(1) ?? '—'} <span className="text-xs text-slate-500">avg last 7</span></div>
                    {change !== null && <div className={`text-[11px] ${change>0?'text-green-400':'text-red-400'}`}>{change>0?'+':''}{change.toFixed(2)} vs prev 7</div>}
                    {change === null && <div className="text-[11px] text-slate-500">Need more data</div>}
                  </div>
                );
              })}
            </div>
          </section>
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-800/50 text-slate-300 text-xs uppercase tracking-wide">
                  <th className="p-2 text-left font-medium">Date</th>
                  <th className="p-2 text-center font-medium">Mood (avg)</th>
                  <th className="p-2 text-center font-medium">Energy (avg)</th>
                  <th className="p-2 text-center font-medium">Anxiety (avg)</th>
                  <th className="p-2 text-center font-medium">Filled Periods</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={5} className="p-4 text-center text-slate-400">Loading...</td></tr>
                )}
                {!loading && !entries.length && (
                  <tr><td colSpan={5} className="p-4 text-center text-slate-500">No entries yet.</td></tr>
                )}
                {!loading && entries.map(e => {
                  const f = flattened.find(f => f.date === e.date)!;
                  const totalFilled = e.slices.reduce((acc,s)=>acc + ['mood','energy','anxiety'].filter(k=> typeof (s as any)[k] === 'number').length,0);
                  const maxPossible = e.slices.length * 3;
                  const pct = Math.round((totalFilled / maxPossible)*100);
                  const isExpanded = expanded === e.date;
                  return (
                    <React.Fragment key={e.id}>
                      <tr className={`border-t border-slate-800 hover:bg-slate-800/40 cursor-pointer ${isExpanded?'bg-slate-800/40':''}`} onClick={()=> setExpanded(isExpanded? null : e.date)}>
                        <td className="p-2 font-mono text-xs sm:text-sm text-slate-300 whitespace-nowrap">{e.date}</td>
                        <td className="p-2 text-center text-slate-200">{f.mood?.toFixed(1) ?? '—'}</td>
                        <td className="p-2 text-center text-slate-200">{f.energy?.toFixed(1) ?? '—'}</td>
                        <td className="p-2 text-center text-slate-200">{f.anxiety?.toFixed(1) ?? '—'}</td>
                        <td className="p-2 text-center text-slate-300 text-xs">{pct}%</td>
                      </tr>
                      {isExpanded && (
                        <tr className="border-t border-slate-800 bg-slate-900/40">
                          <td colSpan={5} className="p-3">
                            <div className="flex flex-col gap-3">
                              <div className="w-full overflow-x-auto">
                                <table className="min-w-[420px] w-full text-xs">
                                  <thead>
                                    <tr className="text-slate-400">
                                      <th className="p-1 text-left">Period</th>
                                      <th className="p-1 text-center">Mood</th>
                                      <th className="p-1 text-center">Energy</th>
                                      <th className="p-1 text-center">Anxiety</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {e.slices.map(s => (
                                      <tr key={s.period} className="border-t border-slate-800">
                                        <td className="p-1 text-left text-slate-400 font-semibold">{s.period}</td>
                                        <td className="p-1 text-center"><MetricBar label="" value={s.mood} color="#6366f1" /></td>
                                        <td className="p-1 text-center"><MetricBar label="" value={s.energy} color="#06b6d4" /></td>
                                        <td className="p-1 text-center"><MetricBar label="" value={s.anxiety} color="#ec4899" /></td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {error && <tr><td colSpan={5} className="p-4 text-center text-red-400">{error}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = typeof value === 'number' ? ((value-1)/9)*100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 text-[11px] text-slate-400">{label}</span>
      <div className="flex-1 h-2 rounded bg-slate-800 overflow-hidden">
        <div className="h-full" style={{ width: pct+'%', background: color, opacity: 0.9 }} />
      </div>
      <span className="w-6 text-[11px] text-slate-300 tabular-nums text-right">{typeof value==='number'? value: '—'}</span>
    </div>
  );
}
