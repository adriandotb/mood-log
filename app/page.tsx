"use client";
import React from 'react';
import { MedicationInputs, MedicationEntry } from '@/components/MedicationInputs';
import { DialInput } from '@/components/DialInput';
import { AuthPanel } from '@/components/AuthPanel';
import { supabase } from '../lib.supabase';


type Period = 'Morning' | 'Noon' | 'Afternoon' | 'Evening';
type Metric = 'mood' | 'energy' | 'anxiety';

type RatingsState = {
  [P in Period]: {
    mood: number | '';
    energy: number | '';
    anxiety: number | '';
  }
};

export default function Page() {
  const [date, setDate] = React.useState<string>(() => new Date().toISOString().slice(0, 10));
  const [meds, setMeds] = React.useState<MedicationEntry[]>([]);
  const [ratings, setRatings] = React.useState<RatingsState>({
    Morning: { mood: '', energy: '', anxiety: '' },
    Noon: { mood: '', energy: '', anxiety: '' },
    Afternoon: { mood: '', energy: '', anxiety: '' },
    Evening: { mood: '', energy: '', anxiety: '' },
  });
  const [saving, setSaving] = React.useState(false);
  const [savedId, setSavedId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);

  const periods: Period[] = ['Morning', 'Noon', 'Afternoon', 'Evening'];
  const metrics: { key: Metric; label: string; color?: string }[] = [
    { key: 'mood', label: 'Mood' },
    { key: 'energy', label: 'Energy', color: '#22d3ee' },
    { key: 'anxiety', label: 'Anxiety', color: '#f472b6' },
  ];

  function updateRating(period: Period, metric: Metric, value: number) {
    setRatings((prev) => ({
      ...prev,
      [period]: { ...prev[period], [metric]: value },
    }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload: any = {
        date,
        medications: meds.filter((m: MedicationEntry) => m.name || m.dose || m.time),
        slices: periods.map((period) => ({ period, ...ratings[period] })),
        created_at: new Date().toISOString(),
      };
      if (userId) payload.user_id = userId;

      const { data, error } = await supabase.from('mood_entries').insert(payload).select('id').single();
      if (error) throw error;
      setSavedId(data.id);
      setTimeout(() => setSavedId(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex justify-between flex-col sm:flex-row gap-4 items-start">
        <div>
          <h2 className="sr-only">Authentication</h2>
          <AuthPanel onAuth={(u) => setUserId(u?.id ?? null)} />
        </div>
        {userId && <div className="text-xs text-green-400">Tracking as user</div>}
      </div>
      <section className="space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-400 uppercase mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
        <MedicationInputs medications={meds} onChange={setMeds} rows={3} />
      </section>


      <section className="space-y-6">
        <h2 className="text-sm font-semibold tracking-wide text-slate-300 uppercase">Daily Ratings</h2>
  <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-1.5 py-2 sm:px-4 sm:py-4 md:px-8 md:py-8 mx-[-4px] sm:mx-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-center">
              <thead>
                <tr>
                  <th className="text-xs text-slate-400 font-medium p-2"></th>
                  {periods.map((period) => (
                    <th key={period} className="text-xs text-slate-400 font-medium p-2">{period}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map(({ key, label, color }) => (
                  <tr key={key}>
                    <td className="text-base sm:text-lg font-bold text-slate-100 p-1 sm:p-2 text-left align-middle whitespace-nowrap">{label}</td>
                    {periods.map((period) => (
                      <td key={period} className="p-1 sm:p-2">
                        <DialInput
                          label=""
                          name={`${period}-${key}`}
                          value={ratings[period][key]}
                          onChange={(v: number) => updateRating(period, key as Metric, v)}
                          color={color}
                          size={typeof window !== 'undefined' && window.innerWidth < 400 ? 44 : 56}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button
          type="submit"
            disabled={saving}
            className="px-6 py-2 rounded bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium shadow"
        >
          {saving ? 'Saving...' : 'Save Entry'}
        </button>
        {savedId && <span className="text-sm text-green-400">Saved!</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </form>
  );
}
