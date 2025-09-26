import React from 'react';

export interface MedicationEntry {
  name: string;
  dose: string;
  time: string;
}

interface MedicationInputsProps {
  medications: MedicationEntry[];
  onChange: (meds: MedicationEntry[]) => void;
  rows?: number;
}

export function MedicationInputs({ medications, onChange, rows = 3 }: MedicationInputsProps) {
  const update = (index: number, field: keyof MedicationEntry, value: string) => {
    const next = [...medications];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const ensureLength = () => {
    if (medications.length < rows) {
      onChange([
        ...medications,
        ...Array.from({ length: rows - medications.length }).map(() => ({ name: '', dose: '', time: '' }))
      ]);
    }
  };

  React.useEffect(() => {
    ensureLength();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold tracking-wide text-slate-300 uppercase">Medication</h2>
      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-slate-500">
        <div className="col-span-6">Name</div>
        <div>Dose</div>
        <div className="col-span-2">Time</div>
        <div className="col-span-3">Notes</div>
      </div>
      {medications.slice(0, rows).map((m, i) => (
        <div key={i} className="grid grid-cols-12 gap-2">
          <input
            className="col-span-6 rounded bg-slate-800 border border-slate-700 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Name"
            value={m.name}
            onChange={(e) => update(i, 'name', e.target.value)}
            name={`medications[${i}][name]`}
          />
          <input
            className="col-span-2 rounded bg-slate-800 border border-slate-700 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Dose"
            value={m.dose}
            onChange={(e) => update(i, 'dose', e.target.value)}
            name={`medications[${i}][dose]`}
          />
          <input
            className="col-span-2 rounded bg-slate-800 border border-slate-700 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="08:00"
            value={m.time}
            onChange={(e) => update(i, 'time', e.target.value)}
            name={`medications[${i}][time]`}
          />
          <input
            className="col-span-2 rounded bg-slate-800 border border-slate-700 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Notes"
            name={`medications[${i}][notes]`}
          />
        </div>
      ))}
    </div>
  );
}
