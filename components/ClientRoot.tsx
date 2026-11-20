'use client';

import dynamic from 'next/dynamic';

// WebGL, GSAP and Howler all need the browser, so the experience is client-only.
const Dreamscape = dynamic(() => import('./Dreamscape'), {
  ssr: false,
  loading: () => (
    <div className="boot">
      <span>Dreamscape</span>
    </div>
  ),
});

export default function ClientRoot() {
  return <Dreamscape />;
}
