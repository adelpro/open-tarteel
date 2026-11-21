export default function Skeleton() {
  return (
    <div
      role="status"
      className="m-auto w-full max-w-md rounded border border-border bg-surface p-4 md:p-6"
    >
      <div className="mb-4 flex h-48 items-center justify-center rounded bg-surface-sunken">
        <div className="h-10 w-10 text-ink-subtle"></div>
      </div>
      <div className="mb-4 h-2.5 w-48 rounded-full bg-surface-sunken"></div>
      <div className="mb-2.5 h-2 rounded-full bg-surface-sunken"></div>
      <div className="mb-2.5 h-2 rounded-full bg-surface-sunken"></div>
      <div className="h-2 rounded-full bg-surface-sunken"></div>
    </div>
  );
}
