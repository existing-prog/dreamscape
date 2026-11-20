'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CHAPTERS } from '@/lib/chapters';
import { CHAPTER_COUNT, scrollState } from '@/lib/scrollState';

gsap.registerPlugin(ScrollTrigger);

/** Seconds the text takes to catch up with the scrollbar — softer, more dreamlike. */
const SCRUB = 1.6;

/**
 * The scrollable story. Each chapter is a tall section: a title card followed
 * by three story panels. Text is pinned with `position: sticky` while you
 * scroll through it, and only opacity/transform are animated (GPU-composited,
 * no repaints). ScrollTrigger maps scroll position to `scrollState.target`,
 * which the camera follows.
 */
export default function Overlay({ onChapterChange }: { onChapterChange: (i: number) => void }) {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray<HTMLElement>('.chapter');
      sections.forEach((section, k) => {
        ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: k === sections.length - 1 ? 'bottom bottom' : 'bottom top',
          onUpdate: (self) => {
            scrollState.target = (k + self.progress) / CHAPTER_COUNT;
          },
          onToggle: (self) => {
            if (self.isActive) onChapterChange(k);
          },
        });
      });

      // Timelines span the whole time a block is on screen (0 → 1); the text
      // is pinned roughly between 0.3 and 0.7 of that range.
      gsap.utils.toArray<HTMLElement>('.title-card').forEach((card) => {
        const inner = card.querySelector('.title-card__inner');
        const title = card.querySelector('.title-card__title');
        const details = card.querySelectorAll('.title-card__numeral, .title-card__tagline');
        gsap
          .timeline({ scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: SCRUB } })
          .fromTo(title, { autoAlpha: 0, scale: 1.25, y: 40 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.25, ease: 'power2.out' }, 0.1)
          .fromTo(details, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.18, stagger: 0.04 }, 0.18)
          .to(inner, { autoAlpha: 0, y: -70, scale: 0.94, duration: 0.25, ease: 'power2.in' }, 0.66)
          .set({}, {}, 1);
      });

      gsap.utils.toArray<HTMLElement>('.panel').forEach((panel) => {
        const inner = panel.querySelector('.panel__inner');
        const tl = gsap
          .timeline({ scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: SCRUB } })
          .fromTo(inner, { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: 0.24, ease: 'power2.out' }, 0.12);
        if (!panel.classList.contains('panel--final')) {
          tl.to(inner, { autoAlpha: 0, y: -80, duration: 0.24, ease: 'power2.in' }, 0.64);
        }
        tl.set({}, {}, 1);
      });
    }, root);

    return () => ctx.revert();
  }, [onChapterChange]);

  const restart = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <main ref={root} className="story">
      {CHAPTERS.map((ch, k) => (
        <section key={ch.id} id={ch.id} className="chapter" aria-labelledby={`${ch.id}-title`}>
          <div className="title-card">
            <div className="sticky">
              <div className="title-card__inner">
                <span className="title-card__numeral">Chapter {ch.numeral}</span>
                <h2 id={`${ch.id}-title`} className="title-card__title">
                  {ch.title}
                </h2>
                <p className="title-card__tagline">{ch.tagline}</p>
              </div>
            </div>
          </div>
          {ch.panels.map((text, i) => {
            const final = k === CHAPTERS.length - 1 && i === ch.panels.length - 1;
            return (
              <div key={i} className={`panel panel--${i % 2 ? 'right' : 'left'}${final ? ' panel--final' : ''}`}>
                <div className="sticky">
                  <div className="panel__inner">
                    <span className="panel__index">
                      {ch.numeral}.{i + 1}
                    </span>
                    <p>{text}</p>
                    {final && (
                      <div className="finale">
                        <p className="finale__line">Wake gently.</p>
                        <button className="btn" onClick={restart}>
                          Dream again
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      ))}
    </main>
  );
}
