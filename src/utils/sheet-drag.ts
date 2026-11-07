/**
 * Physics for the phone bottom sheet.
 *
 * A sheet is a gesture, not just an animation: it follows the finger 1:1,
 * decides where it is heading at release, and hands its velocity to the
 * spring that finishes the move.
 */

const DISMISS_VELOCITY = 800;
const UPWARD_VELOCITY = -400;
const DISMISS_FRACTION = 0.4;
const DECELERATION = 0.998;

export function project(velocity: number, deceleration = DECELERATION): number {
  return ((velocity / 1000) * deceleration) / (1 - deceleration);
}

export function rubberband(
  overshoot: number,
  dimension: number,
  constant = 0.55
): number {
  return (
    (overshoot * dimension * constant) /
    (dimension + constant * Math.abs(overshoot))
  );
}

export const DRAG_THRESHOLD = 8;

export function dragOffset(deltaY: number, height: number): number {
  if (deltaY >= 0) return deltaY;
  return -rubberband(-deltaY, Math.max(1, height));
}

export function shouldDismiss({
  offset,
  velocity,
  height,
}: {
  offset: number;
  velocity: number;
  height: number;
}): boolean {
  if (velocity <= UPWARD_VELOCITY) return false;
  if (velocity >= DISMISS_VELOCITY) return true;
  return offset + project(Math.max(0, velocity)) > height * DISMISS_FRACTION;
}

export type SpringState = { value: number; velocity: number };

export type SpringOptions = {
  target: number;
  dt: number;
  damping?: number;
  response?: number;
};

const MAX_DT = 1 / 30;

export function springStep(
  state: SpringState,
  { target, dt, damping = 1, response = 0.3 }: SpringOptions
): SpringState {
  const step = Math.min(Math.max(dt, 0), MAX_DT);
  if (step === 0) return state;

  const omega = (2 * Math.PI) / Math.max(response, 0.05);
  const stiffness = omega * omega;
  const friction = 2 * damping * omega;
  const acceleration =
    -stiffness * (state.value - target) - friction * state.velocity;
  const velocity = state.velocity + acceleration * step;

  return { value: state.value + velocity * step, velocity };
}
