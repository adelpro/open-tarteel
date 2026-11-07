/**
 * One history entry shared by every open sheet, so Back dismisses the sheet
 * instead of leaving the site. The entry belongs to the layer, not to an
 * individual sheet, because opening a second sheet while closing the first
 * would otherwise pop the arriving sheet's entry.
 */
export type SheetLayerDeps = {
  push: (state: unknown) => void;
  back: () => void;
  state: () => unknown;
  href: () => string;
  schedule: (run: () => void) => void;
};

type Open = { token: string; close: () => void };

export function createSheetLayer(deps: SheetLayerDeps) {
  const open: Open[] = [];
  let here = '';
  let settling = false;

  const ours = () =>
    Boolean(
      (deps.state() as { tarteelSheet?: unknown } | null | undefined)
        ?.tarteelSheet
    );

  return {
    ours,

    acquire(token: string, close: () => void) {
      if (open.length === 0 && !ours()) {
        here = deps.href();
        deps.push({ tarteelSheet: true });
      }
      open.push({ token, close });
    },

    release(token: string, back = true) {
      const at = open.findIndex((entry) => entry.token === token);
      if (at >= 0) open.splice(at, 1);
      if (open.length > 0) return;

      deps.schedule(() => {
        if (open.length > 0) return;
        if (back && ours() && deps.href() === here) deps.back();
      });
    },

    popped() {
      if (settling) return;
      settling = true;
      deps.schedule(() => {
        settling = false;
        open[open.length - 1]?.close();
      });
    },
  };
}
