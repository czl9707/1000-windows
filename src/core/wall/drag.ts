// The wall's pointer gestures: drag to pan, release to glide. The wiring
// lives beside the wall it drives — a pannable surface binds it once and
// the wall at rest (the strip) simply never does. Writes go through the
// wall's camera, velocity, and drag hold; the glide reads the same state.
import type { Wall } from './index';

const CLICK_THRESHOLD_PX = 5;

export function dragWall(wall: Wall, canvas: HTMLCanvasElement, unitPx: () => number): () => void {
  let dragApplied = false;
  let dragDistance = 0;
  let dragStart = { x: 0, y: 0 };
  let activePointer: number | null = null;
  let lastPointer: { x: number; y: number } | null = null;
  let lastMoveTime = 0;

  const onPointerDown = (e: PointerEvent) => {
    if (activePointer !== null) return;
    canvas.setPointerCapture(e.pointerId);
    activePointer = e.pointerId;
    dragApplied = false;
    dragDistance = 0;
    dragStart = { x: e.clientX, y: e.clientY };
    wall.beginDrag();
    lastPointer = { x: e.clientX, y: e.clientY };
    lastMoveTime = performance.now();
  };
  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerId !== activePointer || !lastPointer) return;
    const unitPxNow = unitPx();
    const dx = e.clientX - lastPointer.x;
    const dy = e.clientY - lastPointer.y;
    dragDistance += Math.hypot(dx, dy);
    const now = performance.now();
    const dt = Math.max((now - lastMoveTime) / 1000, 1 / 240);
    lastPointer = { x: e.clientX, y: e.clientY };
    lastMoveTime = now;
    // Crossing the threshold makes the drag real: the camera catches up on
    // everything since the press.
    if (!dragApplied) {
      if (dragDistance < CLICK_THRESHOLD_PX) return;
      dragApplied = true;
      wall.camera = {
        x: wall.camera.x - (e.clientX - dragStart.x) / unitPxNow,
        y: wall.camera.y - (e.clientY - dragStart.y) / unitPxNow,
      };
    } else {
      wall.camera = { x: wall.camera.x - dx / unitPxNow, y: wall.camera.y - dy / unitPxNow };
    }
    wall.velocity = {
      x: 0.5 * wall.velocity.x + 0.5 * (-dx / unitPxNow / dt),
      y: 0.5 * wall.velocity.y + 0.5 * (-dy / unitPxNow / dt),
    };
    // No repaint here: the loop runs continuously, and repaint() would paint
    // this frame at time 0, freezing every pen's boil for the drag's length.
  };
  const release = (keepVelocity: boolean) => {
    activePointer = null;
    lastPointer = null;
    wall.endDrag(keepVelocity);
  };
  const onPointerUp = (e: PointerEvent) => {
    if (e.pointerId !== activePointer) return;
    release(dragApplied);
  };
  const onPointerCancel = (e: PointerEvent) => {
    if (e.pointerId !== activePointer) return;
    release(false);
  };
  // Capture lost without a cancel (the pointer died elsewhere) ends the
  // gesture the same way, or the wall would stay stuck dragging.
  const onLostPointerCapture = (e: PointerEvent) => {
    if (e.pointerId !== activePointer) return;
    release(false);
  };
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerCancel);
  canvas.addEventListener('lostpointercapture', onLostPointerCapture);

  return () => {
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerCancel);
    canvas.removeEventListener('lostpointercapture', onLostPointerCapture);
  };
}
