'use client';

import { useEffect, useRef } from 'react';
import { CHAPTERS } from '@/lib/chapters';
import { scrollState } from '@/lib/scrollState';

type Props = {
  chapter: number;
  muted: boolean;
  onToggleMute: () => void;
};

export default function HUD({ chapter, muted, onToggleMute }: Props) {
  const bar = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLDivElement>(null);

  // Reads the eased progress every frame without re-rendering React.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = scrollState.current;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      if (hint.current) hint.current.style.opacity = String(Math.max(0, 1 - p * 40));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const goTo = (i: number) => {
    const el = document.getElementById(CHAPTERS[i].id);
    if (el) window.scrollTo({ top: el.offsetTop + 2, behavior: 'smooth' });
  };

  return (
    <div className="hud">
      <button className="hud__logo" onClick={() => goTo(0)} aria-label="Dreamscape — back to the beginning">
        Dreamscape
      </button>

      <nav className="hud__nav" aria-label="Chapters">
        {CHAPTERS.map((c, i) => (
          <button
            key={c.id}
            className={`hud__chapter${i === chapter ? ' is-active' : ''}`}
            onClick={() => goTo(i)}
            aria-current={i === chapter ? 'step' : undefined}
          >
            <span className="hud__numeral">{c.numeral}</span>
            <span className="hud__label">{c.title}</span>
          </button>
        ))}
      </nav>

      <button className="hud__sound" onClick={onToggleMute} aria-pressed={!muted} aria-label={muted ? 'Unmute sound' : 'Mute sound'}>
        <span className={`eq${muted ? ' is-muted' : ''}`} aria-hidden>
          <i />
          <i />
          <i />
          <i />
        </span>
        {muted ? 'Sound off' : 'Sound on'}
      </button>

      <div className="hud__hint" ref={hint}>
        <span>Scroll to drift deeper</span>
        <span className="hud__hint-line" />
      </div>

      <div className="hud__progress" aria-hidden>
        <div className="hud__progress-bar" ref={bar} />
      </div>
    </div>
  );
}
