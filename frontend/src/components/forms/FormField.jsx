export default function FormField({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-300">{error.message || error}</span>}
    </label>
  );
}
