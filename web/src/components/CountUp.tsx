import { useEffect, useState } from 'react';

// Counts up to a value on mount — but ONLY for clean quantities like "12" or
// "15+". Anything else (e.g. "24/7", "₹1") renders as-is, so we never animate a
// value where counting looks wrong.
export default function CountUp({ value, duration = 1200 }: { value: string; duration?: number }) {
  const initial = value.match(/^(\d+)(\+?)$/); // integer with optional trailing "+"
  const [display, setDisplay] = useState(initial ? `0${initial[2]}` : value);

  useEffect(() => {
    // Recompute inside the effect so its deps stay primitive ([value, duration]);
    // depending on the match array (new each render) would restart the animation
    // every render and it would never finish.
    const match = value.match(/^(\d+)(\+?)$/);
    if (!match) { setDisplay(value); return; }
    const target = parseInt(match[1], 10);
    const suffix = match[2];
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setDisplay(`${target}${suffix}`); return; }

    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setDisplay(`${Math.round(target * eased)}${suffix}`);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Guarantee the final value even if rAF is throttled (e.g. backgrounded tab),
    // so the number never gets stuck mid-count.
    const settle = setTimeout(() => setDisplay(`${target}${suffix}`), duration + 80);
    return () => { cancelAnimationFrame(raf); clearTimeout(settle); };
  }, [value, duration]);

  return <span>{display}</span>;
}
