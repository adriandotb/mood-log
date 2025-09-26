export default function NotFound() {
  return (
    <div className="py-24 text-center space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Page Not Found</h1>
      <p className="text-slate-400 max-w-md mx-auto">That route doesn&apos;t exist. If you just deployed and see this unexpectedly, double-check your Vercel project settings (Output Directory should be blank) and that you are loading the root URL.</p>
      <a href="/" className="inline-block px-5 py-2 rounded bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium">Return Home</a>
    </div>
  );
}
