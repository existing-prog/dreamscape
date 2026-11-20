import { Howl, Howler } from 'howler';

// Prefix with the base path so audio resolves when hosted under /<repo>/ on GitHub Pages.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const LOOPS = ['awakening', 'void', 'deep', 'ascension'].map((name) => `${BASE}/audio/${name}.wav`);
const LOOP_VOLUME = 0.75;
const CROSSFADE_MS = 2800;

/** Cross-fades one ambient loop per world and rings a chime on each transition. */
class DreamAudio {
  private loops: Howl[] = [];
  private chime: Howl | null = null;
  private current = -1;
  private started = false;

  /** Must be called from a user gesture so browsers allow playback. */
  start(chapter: number) {
    if (this.started) return;
    this.started = true;
    this.loops = LOOPS.map((src) => new Howl({ src: [src], loop: true, volume: 0, preload: true }));
    this.chime = new Howl({ src: [`${BASE}/audio/chime.wav`], volume: 0.35 });
    this.setChapter(chapter, true);
  }

  setChapter(index: number, silent = false) {
    if (!this.started || index === this.current) return;
    const prev = this.current;
    this.current = index;

    const next = this.loops[index];
    if (!next.playing()) next.play();
    next.fade(next.volume(), LOOP_VOLUME, CROSSFADE_MS);

    if (prev >= 0) {
      const old = this.loops[prev];
      old.fade(old.volume(), 0, CROSSFADE_MS);
      window.setTimeout(() => {
        if (this.current !== prev) old.pause();
      }, CROSSFADE_MS + 100);
    }
    if (!silent) this.chime?.play();
  }

  setMuted(muted: boolean) {
    Howler.mute(muted);
  }
}

export const dreamAudio = new DreamAudio();
