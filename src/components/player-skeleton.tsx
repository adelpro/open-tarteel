/**
 * Loading placeholder for the player card. It mirrors the final geometry
 * (72px spectrum slot, 44px controls, range, track line) so the card does not
 * resize when the real player mounts.
 */
export default function PlayerSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading player"
      className="flex w-full max-w-xl animate-pulse flex-col items-center justify-center rounded-[16px] border border-border bg-surface p-3"
      style={{ minHeight: 194 }}
    >
      <div className="mb-2 h-[72px] w-full max-w-md rounded-lg bg-surface-sunken" />
      <div className="flex w-full items-center justify-between gap-2 md:gap-3">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="size-11 rounded-[10px] bg-surface-sunken"
          />
        ))}
      </div>
      <div className="my-3 h-1 w-full rounded-full bg-surface-sunken" />
      <div className="mt-3 h-4 w-40 rounded-full bg-surface-sunken" />
    </div>
  );
}
