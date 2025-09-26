import React from 'react';
import clsx from 'clsx';

interface RatingInputProps {
  label: string;
  name: string;
  value: number | '';
  onChange: (value: number) => void;
}

export function RatingInput({ label, name, value, onChange }: RatingInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</label>
      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: 10 }).map((_, i) => {
          const v = i + 1;
          const active = value === v;
          return (
            <button
              type="button"
              key={v}
              aria-label={`${label} ${v}`}
              onClick={() => onChange(v)}
              className={clsx(
                'h-8 text-[10px] rounded border flex items-center justify-center transition-colors',
                active
                  ? 'bg-brand-500 border-brand-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              )}
            >
              {v}
            </button>
          );
        })}
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
