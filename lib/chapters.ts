export type Chapter = {
  id: string;
  numeral: string;
  title: string;
  tagline: string;
  panels: string[];
  /** Give the chapter's last sentence a longer hold before moving on. */
  linger?: boolean;
};

export const CHAPTERS: Chapter[] = [
  {
    id: 'awakening',
    numeral: 'I',
    title: 'The Awakening',
    tagline: 'Where light first remembers you',
    panels: [
      'You were nowhere, and then — a color. The soft ache of dawn pressing against closed eyelids.',
      'Shapes drift loose from the dark: fragments of half-remembered rooms, of voices, of a sky you once knew.',
      'Move gently. Everything here leans toward you, curious. The dream has noticed you are awake inside it.',
    ],
  },
  {
    id: 'void',
    numeral: 'II',
    title: 'The Void',
    tagline: 'The silence between thoughts',
    panels: [
      'Past the edge of morning, the color drains away. What remains is the space between thoughts.',
      'Monoliths stand like unanswered questions. At the center, something pulls — patient, hungry, absolute.',
      'In the void there is no up, no down. Only the choice to keep falling, or to let go.',
    ],
  },
  {
    id: 'deep',
    numeral: 'III',
    title: 'The Deep',
    tagline: 'Beneath the weight of memory',
    panels: [
      'You let go. The darkness turns to water, cold and enormous, heavy with everything you never said.',
      'Here, light is alive. It pulses through soft bodies that drift without fear, singing in frequencies older than words.',
      'The deeper you sink, the clearer it becomes: you were never drowning. You were learning to breathe.',
    ],
    linger: true,
  },
  {
    id: 'ascension',
    numeral: 'IV',
    title: 'The Ascension',
    tagline: 'Toward the light that called you',
    panels: [
      'Something lifts you. Through the clouds, past the surface of sleep, into a gold that hums.',
      'Islands of stone hang in the warm air, each one a piece of you, finally weightless.',
      'At the summit there is only light — and the quiet understanding that every dream is a way home.',
    ],
    linger: true,
  },
];
