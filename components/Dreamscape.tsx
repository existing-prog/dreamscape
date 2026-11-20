'use client';

import { useCallback, useEffect, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { dreamAudio } from '@/lib/audio';
import Scene from './Scene';
import Overlay from './ui/Overlay';
import HUD from './ui/HUD';
import EnterGate from './ui/EnterGate';

export default function Dreamscape() {
  const [entered, setEntered] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('is-locked', !entered);
    if (entered) ScrollTrigger.refresh();
  }, [entered]);

  useEffect(() => {
    if (entered) dreamAudio.setChapter(chapter);
  }, [chapter, entered]);

  const enter = useCallback(() => {
    dreamAudio.start(0);
    setEntered(true);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      dreamAudio.setMuted(!m);
      return !m;
    });
  }, []);

  return (
    <div className="dreamscape" data-chapter={chapter} data-entered={entered}>
      <div className="stage">
        <Scene />
      </div>
      <Overlay onChapterChange={setChapter} />
      {entered && <HUD chapter={chapter} muted={muted} onToggleMute={toggleMute} />}
      <EnterGate visible={!entered} onEnter={enter} />
    </div>
  );
}
