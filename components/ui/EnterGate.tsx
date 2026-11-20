'use client';

import { useEffect, useState } from 'react';
import { isSoftwareRendering } from '@/lib/gpu';

export default function EnterGate({ visible, onEnter }: { visible: boolean; onEnter: () => void }) {
  const [slowGpu, setSlowGpu] = useState(false);

  useEffect(() => {
    setSlowGpu(isSoftwareRendering());
  }, []);

  return (
    <div className={`gate${visible ? '' : ' is-hidden'}`} aria-hidden={!visible}>
      <div className="gate__inner">
        <p className="gate__kicker">An interactive dream in four worlds</p>
        <h1 className="gate__title">Dreamscape</h1>
        <p className="gate__lead">Close your eyes. Let the dream find you.</p>
        <button className="btn btn--large" onClick={onEnter} tabIndex={visible ? 0 : -1}>
          Enter the dream
        </button>
        <ul className="gate__tips">
          <li>Move your mouse to look around</li>
          <li>Scroll to drift between worlds</li>
          <li>Best with sound</li>
        </ul>
        {slowGpu && (
          <p className="gate__warning" role="status">
            Your browser is drawing 3D graphics without your graphics card, so the dream will stutter. Turn on
            &ldquo;Use hardware acceleration when available&rdquo; in your browser&rsquo;s settings and restart it.
          </p>
        )}
      </div>
    </div>
  );
}
