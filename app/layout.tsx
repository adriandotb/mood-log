import './globals.css';
import type { Metadata } from 'next';
import React from 'react';
import AuthHeader from './ui/AuthHeader';

export const metadata: Metadata = {
  title: 'Mood Tracker',
  description: 'Quick 60-second mood, energy, anxiety capture with medication log',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh font-sans">
        <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
          <AuthHeader />
          {children}
          <footer className="pt-8 text-center text-xs text-slate-500">© {new Date().getFullYear()} Mood Tracker</footer>
        </div>
      </body>
    </html>
  );
}
