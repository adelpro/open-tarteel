/**
 * Loading placeholder for the player card. It mirrors the real card's four
 * groups — now-playing header, 72px visualiser slot, seek track and transport
 * — at the same max-w-lg width and padding, with no fixed height. The real
 * player is content-sized, so reserving an arbitrary height here caused a
 * layout shift when it mounted.
 */
export default function PlayerSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading player"
      className="flex w-full max-w-lg flex-col items-center justify-start rounded-[16px] border border-border bg-surface p-4"
    >
      <div className="flex w-full flex-col">
        {/* 1. now-playing header — surah 18/700, reciter 13 muted */}
        <div className="w-full pb-1 text-center">
          <div className="mx-auto h-[18px] w-2/3 rounded bg-surface-sunken" />
          <div className="mx-auto mt-1 h-[13px] w-1/3 rounded bg-surface-sunken" />
        </div>

        {/* 2. visualiser — same 72px slot the dynamic canvas reserves */}
        <div className="mb-2 h-[72px] w-full rounded-lg bg-surface-sunken" />

        {/* 3. seek — same my-3 h-1 track as Range */}
        <div className="my-3 h-1 w-full rounded-full bg-surface-sunken" />

        {/* 4. transport — 44/44/56/44/44 controls plus the metadata line */}
        <div className="flex w-full flex-col items-center gap-1">
          <div className="flex h-14 w-full items-center justify-center gap-2">
            <div className="size-11 rounded-[10px] bg-surface-sunken" />
            <div className="size-11 rounded-[10px] bg-surface-sunken" />
            <div className="size-14 rounded-full bg-surface-sunken" />
            <div className="size-11 rounded-[10px] bg-surface-sunken" />
            <div className="size-11 rounded-[10px] bg-surface-sunken" />
          </div>
          <div className="h-4 w-1/3 rounded bg-surface-sunken" />
        </div>
      </div>
    </div>
  );
}
