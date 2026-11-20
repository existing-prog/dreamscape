// Procedurally synthesises the Dreamscape ambience loops into /public/audio.
// Run with: npm run audio
// Every loop is rendered slightly longer than its loop length and the tail is
// cross-faded into the head, so Howler can loop it without a click.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 22050;
const LOOP = 24; // seconds
const FADE = 3; // seconds of tail cross-faded into the head
const TAU = Math.PI * 2;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio');

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const buffer = (sec) => new Float32Array(Math.floor(sec * SR));

// Sustained pad: detuned harmonic voices with slow, independent swells.
function pad(buf, freqs, amp, rand, harmonics = [1, 0.35, 0.12], detune = 0.35, vib = 0) {
  for (const f of freqs) {
    for (const d of [-detune, detune]) {
      const swellRate = (1 + Math.floor(rand() * 3)) / LOOP;
      const swellPhase = rand() * TAU;
      const startPhase = rand() * TAU;
      const vibRate = 4.5 + rand();
      let phase = startPhase;
      for (let n = 0; n < buf.length; n++) {
        const t = n / SR;
        const fv = (f + d) * (1 + vib * Math.sin(TAU * vibRate * t));
        phase += (TAU * fv) / SR;
        let s = 0;
        for (let h = 0; h < harmonics.length; h++) s += harmonics[h] * Math.sin(phase * (h + 1));
        const swell = 0.55 + 0.45 * Math.sin(TAU * swellRate * t + swellPhase);
        buf[n] += s * swell * amp;
      }
    }
  }
}

// Inharmonic bell / glass tone.
function bell(buf, t0, f, amp, decay = 2.5) {
  const partials = [
    [1, 1],
    [2.76, 0.45],
    [5.4, 0.2],
    [8.93, 0.08],
  ];
  const start = Math.floor(t0 * SR);
  const len = Math.min(buf.length - start, Math.floor(decay * 3 * SR));
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.004) * Math.exp(-t / (decay * 0.45));
    let s = 0;
    for (const [m, a] of partials) s += a * Math.sin(TAU * f * m * t) * Math.exp(-t * m * 0.35);
    buf[start + i] += s * env * amp;
  }
}

// Gliding voice (whale song, distant calls).
function glide(buf, t0, dur, points, amp, harmonics = [1, 0.4, 0.2], vibDepth = 0, vibRate = 4) {
  const start = Math.floor(t0 * SR);
  const len = Math.min(buf.length - start, Math.floor(dur * SR));
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const u = i / len;
    const seg = u * (points.length - 1);
    const k = Math.min(points.length - 2, Math.floor(seg));
    const local = seg - k;
    const e = local * local * (3 - 2 * local);
    const f = points[k] + (points[k + 1] - points[k]) * e + vibDepth * Math.sin(TAU * vibRate * (i / SR));
    phase += (TAU * f) / SR;
    let s = 0;
    for (let h = 0; h < harmonics.length; h++) s += harmonics[h] * Math.sin(phase * (h + 1));
    const env = Math.sin(Math.PI * u) ** 1.5;
    buf[start + i] += s * env * amp;
  }
}

// Filtered noise. `brown` integrates for a deeper rumble; `lfo` shapes it into waves.
function noise(buf, amp, cutoff, rand, { brown = false, lfoRate = 0, lfoDepth = 0 } = {}) {
  const a = Math.exp((-TAU * cutoff) / SR);
  let lp = 0;
  let lp2 = 0;
  let br = 0;
  for (let n = 0; n < buf.length; n++) {
    let w = rand() * 2 - 1;
    if (brown) {
      br = (br + 0.02 * w) * 0.997;
      w = br * 3.5;
    }
    lp = (1 - a) * w + a * lp;
    lp2 = (1 - a) * lp + a * lp2;
    const mod = 1 - lfoDepth * (0.5 + 0.5 * Math.sin(TAU * lfoRate * (n / SR)));
    buf[n] += lp2 * amp * mod;
  }
}

// Small Freeverb-style reverb for a sense of space.
function reverb(x, mix = 0.35, room = 0.84, damp = 0.35) {
  const scale = SR / 44100;
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((d) => Math.round(d * scale * 1.6));
  const aps = [556, 441, 341, 225].map((d) => Math.round(d * scale));
  const wet = new Float32Array(x.length);
  for (const d of combs) {
    const line = new Float32Array(d);
    let idx = 0;
    let store = 0;
    for (let n = 0; n < x.length; n++) {
      const y = line[idx];
      store = y * (1 - damp) + store * damp;
      line[idx] = x[n] + store * room;
      idx = (idx + 1) % d;
      wet[n] += y;
    }
  }
  for (const d of aps) {
    const line = new Float32Array(d);
    let idx = 0;
    for (let n = 0; n < wet.length; n++) {
      const b = line[idx];
      line[idx] = wet[n] + b * 0.5;
      wet[n] = b - wet[n];
      idx = (idx + 1) % d;
    }
  }
  const pk = (arr) => arr.reduce((m, v) => Math.max(m, Math.abs(v)), 1e-9);
  const dp = pk(x);
  const wp = pk(wet);
  const out = new Float32Array(x.length);
  for (let n = 0; n < x.length; n++) out[n] = x[n] * (1 - mix) + (wet[n] / wp) * dp * mix;
  return out;
}

function loopify(buf) {
  const n = LOOP * SR;
  const f = FADE * SR;
  const out = buf.slice(0, n);
  for (let i = 0; i < f; i++) {
    const g = i / f;
    out[i] = buf[i] * Math.sin((g * Math.PI) / 2) + buf[n + i] * Math.cos((g * Math.PI) / 2);
  }
  return out;
}

function normalize(buf, peak = 0.7) {
  let m = 1e-9;
  for (const v of buf) m = Math.max(m, Math.abs(v));
  for (let i = 0; i < buf.length; i++) buf[i] = (buf[i] / m) * peak;
  return buf;
}

function writeWav(name, data) {
  const bytes = 44 + data.length * 2;
  const b = Buffer.alloc(bytes);
  b.write('RIFF', 0);
  b.writeUInt32LE(bytes - 8, 4);
  b.write('WAVE', 8);
  b.write('fmt ', 12);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36);
  b.writeUInt32LE(data.length * 2, 40);
  for (let i = 0; i < data.length; i++) {
    b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, data[i])) * 32767), 44 + i * 2);
  }
  writeFileSync(join(OUT, name), b);
  console.log(`  ✓ ${name} (${(bytes / 1024).toFixed(0)} KB)`);
}

// ---------------------------------------------------------------- worlds ----

function awakening() {
  const rand = rng(11);
  const buf = buffer(LOOP + FADE);
  pad(buf, [110, 164.81, 220, 277.18, 329.63, 493.88], 0.05, rand);
  const scale = [880, 987.77, 1108.73, 1318.51, 1479.98, 1760];
  for (let t = 0.8; t < LOOP; t += 1.4 + rand() * 1.8) {
    bell(buf, t, scale[Math.floor(rand() * scale.length)], 0.05 + rand() * 0.04, 2.2);
  }
  noise(buf, 0.06, 900, rand, { lfoRate: 2 / LOOP, lfoDepth: 0.6 });
  return normalize(loopify(reverb(buf, 0.45)), 0.6);
}

function theVoid() {
  const rand = rng(23);
  const buf = buffer(LOOP + FADE);
  pad(buf, [41.2, 55, 55.35, 82.41], 0.12, rand, [1, 0.25, 0.08], 0.12);
  glide(buf, 3, 9, [220, 207.65, 196], 0.035, [1, 0.3], 1.2, 0.4);
  glide(buf, 14, 9, [329.63, 311.13, 349.23], 0.025, [1, 0.3], 1.2, 0.35);
  noise(buf, 0.18, 260, rand, { lfoRate: 1 / LOOP, lfoDepth: 0.8 });
  return normalize(loopify(reverb(buf, 0.6, 0.9)), 0.55);
}

function theDeep() {
  const rand = rng(37);
  const buf = buffer(LOOP + FADE);
  noise(buf, 0.6, 180, rand, { brown: true, lfoRate: 3 / LOOP, lfoDepth: 0.7 });
  pad(buf, [36.71, 73.42], 0.08, rand, [1, 0.2], 0.1);
  glide(buf, 2.5, 4.2, [210, 150, 175, 140], 0.07, [1, 0.45, 0.2], 3, 4);
  glide(buf, 13.5, 5, [180, 240, 160], 0.05, [1, 0.45, 0.2], 3, 3.5);
  // bubble clusters
  for (let c = 0; c < 7; c++) {
    let t = rand() * (LOOP - 1);
    const count = 4 + Math.floor(rand() * 7);
    for (let i = 0; i < count; i++) {
      const f0 = 400 + rand() * 500;
      glide(buf, t, 0.04 + rand() * 0.05, [f0, f0 * 2.6], 0.025, [1]);
      t += 0.05 + rand() * 0.14;
    }
  }
  return normalize(loopify(reverb(buf, 0.5, 0.88, 0.6)), 0.6);
}

function ascension() {
  const rand = rng(53);
  const buf = buffer(LOOP + FADE);
  pad(buf, [146.83, 220, 293.66, 369.99, 440, 587.33], 0.04, rand, [1, 0.5, 0.25, 0.12], 0.4, 0.004);
  const arp = [1174.66, 1318.51, 1479.98, 1760, 1975.53, 2349.32];
  let k = 0;
  for (let t = 0.5; t < LOOP; t += 0.75) {
    if (rand() < 0.75) bell(buf, t, arp[k % arp.length], 0.03 + rand() * 0.02, 1.8);
    k += rand() < 0.8 ? 1 : 2;
  }
  noise(buf, 0.05, 2400, rand, { lfoRate: 2 / LOOP, lfoDepth: 0.5 });
  return normalize(loopify(reverb(buf, 0.5)), 0.6);
}

function chime() {
  const buf = buffer(5);
  bell(buf, 0.02, 659.25, 0.5, 2.6);
  bell(buf, 0.1, 987.77, 0.35, 2.4);
  bell(buf, 0.2, 1318.51, 0.25, 2.2);
  return normalize(reverb(buf, 0.45), 0.5);
}

mkdirSync(OUT, { recursive: true });
console.log('Synthesising Dreamscape ambience…');
writeWav('awakening.wav', awakening());
writeWav('void.wav', theVoid());
writeWav('deep.wav', theDeep());
writeWav('ascension.wav', ascension());
writeWav('chime.wav', chime());
