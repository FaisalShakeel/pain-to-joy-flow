import { useEffect, useRef } from "react";

/**
 * Enables click-and-drag scrolling with inertial momentum on any scrollable element.
 * Works in addition to native wheel / touch scrolling. Hides nothing — the consumer
 * is responsible for `.no-scrollbar` etc. Pass axis "x" for horizontal containers.
 */
export function useDragScroll<T extends HTMLElement>(axis: "x" | "y" = "y") {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startPos = 0;
    let startScroll = 0;
    let lastPos = 0;
    let lastTime = 0;
    let velocity = 0;
    let rafId = 0;

    const getPos = (e: PointerEvent) => (axis === "x" ? e.clientX : e.clientY);
    const getScroll = () => (axis === "x" ? el.scrollLeft : el.scrollTop);
    const setScroll = (v: number) => {
      if (axis === "x") el.scrollLeft = v;
      else el.scrollTop = v;
    };

    const cancelMomentum = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    };

    const momentum = () => {
      if (Math.abs(velocity) < 0.05) {
        rafId = 0;
        return;
      }
      setScroll(getScroll() + velocity);
      velocity *= 0.94; // friction
      rafId = requestAnimationFrame(momentum);
    };

    const onDown = (e: PointerEvent) => {
      // Allow native clicks on interactive children — only hijack on primary drag
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('a, button, input, textarea, select, [role="button"], [data-no-drag-scroll]')) return;
      isDown = true;
      cancelMomentum();
      startPos = getPos(e);
      startScroll = getScroll();
      lastPos = startPos;
      lastTime = performance.now();
      velocity = 0;
      el.style.cursor = "grabbing";
    };

    const onMove = (e: PointerEvent) => {
      if (!isDown) return;
      const pos = getPos(e);
      const dx = pos - startPos;
      // Only capture pointer once movement exceeds threshold so taps still register as clicks
      if (Math.abs(dx) > 6 && !el.hasPointerCapture(e.pointerId)) {
        try { el.setPointerCapture(e.pointerId); } catch {}
      }
      if (Math.abs(dx) > 4) {
        setScroll(startScroll - dx);
        const now = performance.now();
        const dt = Math.max(1, now - lastTime);
        velocity = ((lastPos - pos) / dt) * 16; // px per frame
        lastPos = pos;
        lastTime = now;
      }
    };

    const onUp = (e: PointerEvent) => {
      if (!isDown) return;
      isDown = false;
      el.style.cursor = "";
      if (el.hasPointerCapture(e.pointerId)) {
        try { el.releasePointerCapture(e.pointerId); } catch {}
        // Prevent the click that would follow a real drag
        const moved = Math.abs(getPos(e) - startPos) > 6;
        if (moved) {
          const blockClick = (ev: Event) => {
            ev.stopPropagation();
            ev.preventDefault();
            el.removeEventListener("click", blockClick, true);
          };
          el.addEventListener("click", blockClick, true);
        }
      }
      if (Math.abs(velocity) > 0.5) {
        rafId = requestAnimationFrame(momentum);
      }
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("pointerleave", onUp);

    el.style.cursor = "grab";

    return () => {
      cancelMomentum();
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("pointerleave", onUp);
    };
  }, [axis]);

  return ref;
}
