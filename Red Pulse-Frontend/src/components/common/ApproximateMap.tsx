export function ApproximateMap({ label }: { label: string }) {
  return (
    <div className="flex h-56 items-end rounded-2xl border border-dashed border-stone-300 bg-[radial-gradient(circle_at_30%_40%,#fecdd3,transparent_35%),radial-gradient(circle_at_70%_60%,#e7e5e4,transparent_40%)] p-4 dark:border-stone-700">
      <p className="rounded-xl bg-white/90 px-3 py-2 text-sm text-stone-600 dark:bg-stone-950/90 dark:text-stone-300">
        Approximate area: {label}. Exact home locations are never shown.
      </p>
    </div>
  );
}
