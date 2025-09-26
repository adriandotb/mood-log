import './globals.css';
import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Mood Tracker',
  description: 'Quick 60-second mood, energy, anxiety capture with medication log',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh font-sans">
        <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
          <header className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Mood Tracker</h1>
            <p className="text-sm text-slate-400">Capture how you feel today in under a minute.</p>
          </header>
          {children}
          <footer className="pt-8 text-center text-xs text-slate-500">© {new Date().getFullYear()} Mood Tracker</footer>
        </div>
      </body>
    </html>
  );
}
