export default function Skeleton({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-24 animate-pulse rounded-lg border border-line bg-white/[0.055]" />
      ))}
    </div>
  );
}
