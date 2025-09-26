import React from 'react';

export interface MedicationEntry {
  name: string;
  dose: string;
  time: string;
  notes?: string;
}

interface MedicationInputsProps {
  medications: MedicationEntry[];
  onChange: (meds: MedicationEntry[]) => void;
  rows?: number;
}

export function MedicationInputs({ medications, onChange, rows = 3 }: MedicationInputsProps) {
  const update = (index: number, field: keyof MedicationEntry, value: string) => {
    const next = [...medications];
  next[index] = { ...next[index], [field]: value } as MedicationEntry;
    onChange(next);
  };

  const ensureLength = () => {
    if (medications.length < rows) {
      onChange([
        ...medications,
        ...Array.from({ length: rows - medications.length }).map(() => ({ name: '', dose: '', time: '', notes: '' }))
      ]);
    }
  };

  React.useEffect(() => {
    ensureLength();
    // Re-run when medications length shrinks (e.g., reset after date change)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, medications.length]);

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold tracking-wide text-slate-300 uppercase">Medication</h2>
      <div className="overflow-x-auto">
        <table className="min-w-[420px] w-full text-xs">
          <thead>
            <tr className="text-slate-500 font-medium">
              <th className="text-left px-2 py-1 w-[32%]">Name</th>
              <th className="text-left px-2 py-1 w-[18%]">Dose</th>
              <th className="text-left px-2 py-1 w-[18%]">Time</th>
              <th className="text-left px-2 py-1 w-[32%]">Notes</th>
            </tr>
          </thead>
          <tbody>
            {medications.slice(0, rows).map((m, i) => (
              <tr key={i}>
                <td className="px-2 py-1">
                  <input
                    className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Name"
                    value={m.name}
                    onChange={(e) => update(i, 'name', e.target.value)}
                    name={`medications[${i}][name]`}
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Dose"
                    value={m.dose}
                    onChange={(e) => update(i, 'dose', e.target.value)}
                    name={`medications[${i}][dose]`}
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="08:00"
                    value={m.time}
                    onChange={(e) => update(i, 'time', e.target.value)}
                    name={`medications[${i}][time]`}
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Notes"
                    value={m.notes || ''}
                    onChange={(e) => update(i, 'notes', e.target.value)}
                    name={`medications[${i}][notes]`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
