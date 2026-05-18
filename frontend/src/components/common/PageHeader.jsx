export default function PageHeader({ title, eyebrow, action }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-widest text-acid">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">{title}</h1>
      </div>
      {action}
    </div>
  );
}
