'use client';

import {
  PointerEvent as ReactPointerEvent,
  ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { MdClose, MdOutlinePushPin, MdPushPin } from 'react-icons/md';
import { useIntl } from 'react-intl';

import { cn } from '@/utils';
import {
  DRAG_THRESHOLD,
  dragOffset,
  shouldDismiss,
  springStep,
} from '@/utils/sheet-drag';
import { createSheetLayer } from '@/utils/sheet-layer';

/** One history entry for the whole sheet layer. */
const sheetLayer = createSheetLayer({
  push: (state) => window.history.pushState(state, ''),
  back: () => window.history.back(),
  state: () => window.history.state,
  href: () => window.location.href,
  schedule: (run) => requestAnimationFrame(() => run()),
});

function useMediaQuery(query: string) {
  // The sheet is rendered only after the client mounts, so the real match can
  // be the initial value. Starting at `false` briefly acquired the mobile
  // history layer on desktop and closed the panel on the first pin.
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);

  return matches;
}

type SheetProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  toolbar?: ReactNode;
  children: ReactNode;
  /** Desktop only: keep the panel docked after picking a row. */
  pinned?: boolean;
  onTogglePin?: () => void;
  /** Skip the history Back when the sheet closes because a row was picked. */
  skipHistoryBack?: { current: boolean };
};

/**
 * The reciter picker shell: a native bottom sheet on a phone and a docked,
 * non-modal panel on a desktop, matching the open-tilawa interaction.
 */
export default function Sheet({
  title,
  open,
  onClose,
  toolbar,
  children,
  pinned = false,
  onTogglePin,
  skipHistoryBack,
}: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wide = useMediaQuery('(min-width: 1024px)');
  const token = useId();
  const { formatMessage } = useIntl();

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const offset = useRef(0);
  const releaseVelocity = useRef(0);
  const frame = useRef(0);
  const generation = useRef(0);
  const dragState = useRef<{
    id: number;
    startY: number;
    moved: boolean;
    samples: { y: number; t: number }[];
  } | null>(null);
  const panelHeight = useRef(0);

  const measure = () => {
    panelHeight.current =
      panelRef.current?.getBoundingClientRect().height ||
      window.innerHeight * 0.9;
    return panelHeight.current;
  };
  const height = () => panelHeight.current || measure();
  const reduceMotion = () =>
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  const apply = (value: number) => {
    const panel = panelRef.current;
    if (panel) {
      panel.style.transform =
        value === 0 ? '' : `translate3d(0, ${value}px, 0)`;
    }
  };

  const stop = () => {
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = 0;
    generation.current += 1;
    if (panelRef.current) panelRef.current.style.willChange = '';
  };

  const animate = (target: number, velocity: number, done?: () => void) => {
    stop();
    if (!panelRef.current || reduceMotion()) {
      offset.current = target;
      apply(target);
      done?.();
      return;
    }

    panelRef.current.style.willChange = 'transform';
    const current = generation.current;
    let state = { value: offset.current, velocity };
    let previous = performance.now();

    const step = (now: number) => {
      if (current !== generation.current) return;
      state = springStep(state, { target, dt: (now - previous) / 1000 });
      previous = now;
      offset.current = state.value;
      apply(state.value);
      if (
        Math.abs(state.value - target) > 0.5 ||
        Math.abs(state.velocity) > 12
      ) {
        frame.current = requestAnimationFrame(step);
        return;
      }
      frame.current = 0;
      offset.current = target;
      apply(target);
      if (panelRef.current) panelRef.current.style.willChange = '';
      done?.();
    };

    frame.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        stop();
        dialog.showModal();
        measure();
        offset.current = reduceMotion() ? 0 : Math.min(72, height() * 0.15);
      } else {
        stop();
      }
      apply(offset.current);
      animate(0, 0);
      return;
    }

    if (!dialog.open) return;

    const velocity = releaseVelocity.current;
    releaseVelocity.current = 0;
    animate(height(), velocity, () => {
      dialog.close();
      offset.current = 0;
      panelHeight.current = 0;
      apply(0);
    });
    // The exit animation is intentionally tied to `open` only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || wide) return;
    sheetLayer.acquire(token, () => onCloseRef.current());
    const onPop = () => {
      if (!sheetLayer.ours()) sheetLayer.popped();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      const skip = skipHistoryBack?.current ?? false;
      if (skipHistoryBack) skipHistoryBack.current = false;
      sheetLayer.release(token, !skip);
    };
  }, [open, wide, token, skipHistoryBack]);

  useEffect(() => {
    if (!wide || !open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [wide, open, onClose]);

  const onDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (
      (event.target as HTMLElement).closest('button, a, input, [role="button"]')
    ) {
      return;
    }
    stop();
    measure();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // The pointer may already be gone.
    }
    dragState.current = {
      id: event.pointerId,
      startY: event.clientY,
      moved: false,
      samples: [{ y: event.clientY, t: performance.now() }],
    };
  };

  const onDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = dragState.current;
    if (!state || state.id !== event.pointerId) return;

    const delta = event.clientY - state.startY;
    if (!state.moved) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return;
      state.moved = true;
      if (panelRef.current) panelRef.current.style.willChange = 'transform';
    }

    offset.current = dragOffset(delta, height());
    apply(offset.current);
    state.samples.push({ y: event.clientY, t: performance.now() });
    if (state.samples.length > 6) state.samples.shift();
  };

  const finishDrag = (
    event: ReactPointerEvent<HTMLDivElement>,
    cancelled: boolean
  ) => {
    const state = dragState.current;
    if (!state || state.id !== event.pointerId) return;
    dragState.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Already released.
    }
    if (!state.moved) {
      if (panelRef.current) panelRef.current.style.willChange = '';
      return;
    }

    const now = performance.now();
    const recent = state.samples.filter((sample) => now - sample.t < 120);
    let velocity = 0;
    if (!cancelled && recent.length > 1) {
      const first = recent[0];
      const last = recent[recent.length - 1];
      const seconds = Math.max((last.t - first.t) / 1000, 0.016);
      velocity = Math.max(-4000, Math.min(4000, (last.y - first.y) / seconds));
    }

    if (
      !cancelled &&
      shouldDismiss({ offset: offset.current, velocity, height: height() })
    ) {
      releaseVelocity.current = velocity;
      onClose();
      return;
    }

    animate(0, velocity);
  };

  const headerContent = (
    <>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="flex items-center gap-1">
        {wide && onTogglePin ? (
          <button
            type="button"
            onClick={onTogglePin}
            aria-pressed={pinned}
            aria-label={formatMessage({
              id: pinned ? 'common.unpin' : 'common.pin',
              defaultMessage: pinned ? 'Unpin panel' : 'Pin panel',
            })}
            title={formatMessage({
              id: pinned ? 'common.unpin' : 'common.pin',
              defaultMessage: pinned ? 'Unpin panel' : 'Pin panel',
            })}
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-surface-sunken',
              pinned ? 'text-foreground' : 'text-muted'
            )}
          >
            {pinned ? (
              <MdPushPin className="size-5" />
            ) : (
              <MdOutlinePushPin className="size-5" />
            )}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          aria-label={formatMessage({
            id: 'close',
            defaultMessage: 'Close',
          })}
          className="-me-2 flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-sunken hover:text-foreground"
        >
          <MdClose className="size-5" />
        </button>
      </div>
    </>
  );

  if (wide) {
    return (
      <aside
        aria-label={title}
        className={cn(
          'fixed inset-y-0 start-0 top-14 z-[60] w-[360px] flex-col border-e border-border bg-surface text-foreground',
          open ? 'flex' : 'hidden'
        )}
      >
        <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-border px-4">
          {headerContent}
        </div>
        {toolbar}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </aside>
    );
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 mx-auto w-full max-w-[520px] rounded-t-2xl border-t border-border bg-surface p-0 text-foreground backdrop:bg-zinc-500/50 dark:backdrop:bg-zinc-900/60"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1.5 flex justify-center"
      >
        <span className="h-1 w-9 rounded-full bg-border-strong" />
      </span>
      <div ref={panelRef} className="flex h-[90dvh] flex-col">
        <div
          className="flex h-[52px] shrink-0 select-none items-center justify-between border-b border-border px-4"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={(event) => finishDrag(event, false)}
          onPointerCancel={(event) => finishDrag(event, true)}
        >
          {headerContent}
        </div>
        {toolbar}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
          {children}
        </div>
      </div>
    </dialog>
  );
}
