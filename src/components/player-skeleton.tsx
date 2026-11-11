/**
 * Loading placeholder for the player card. It mirrors the final geometry so
 * the card does not resize when the real player mounts: one rounded slab for
 * the spectrum and a thinner one for the transport.
 */
export default function PlayerSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading player"
      className="flex w-full max-w-xl animate-pulse flex-col items-center justify-center gap-3 rounded-[16px] border border-border bg-surface p-3"
      style={{ minHeight: 258 }}
    >
      <div className="h-[72px] w-full max-w-md rounded-lg bg-surface-sunken" />
      <div className="h-8 w-full rounded-lg bg-surface-sunken" />
    </div>
  );
}
