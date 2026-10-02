"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A score ring that animates to its value once it scrolls into view.
 *
 * This is deliberately the only animation on the site that is not a hover
 * state. A decorative particle field was considered and rejected: it would have
 * cost CPU on the low-end devices this product tells people to care about, and
 * it is the single most overused visual in AI landing pages, which is the
 * opposite of the position this site is trying to hold.
 *
 * This moves, and it says something while it moves. It also stops entirely when
 * the reader has asked for reduced motion, in which case the final value is
 * simply shown.
 */
export default function ScoreRing({
  value,
  size = 88,
  stroke = 6,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [shown, setShown] = useState(0);

  // Start when it is actually on screen. Animating something nobody is looking
  // at wastes the one moment it had to be noticed.
  useEffect(() => {
    const el = holder.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") {
      setShown(value);
      setStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  useEffect(() => {
    if (!started) return;
    const duration = 1100;
    const from = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - from) / duration);
      // easeOutCubic: fast enough to feel responsive, slow enough at the end
      // that the number is readable as it lands.
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, value]);

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, shown)) / 100);

  const color = value >= 80 ? "#34d399" : value >= 60 ? "#fbbf24" : "#f87171";

  return (
    <div
      ref={holder}
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `Score ${value} out of 100`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1f2937"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono font-black text-white leading-none" style={{ fontSize: size * 0.26 }}>
          {Math.round(shown)}
        </span>
        <span className="font-mono text-gray-500 leading-none pt-1" style={{ fontSize: size * 0.11 }}>
          /100
        </span>
      </div>
    </div>
  );
}
