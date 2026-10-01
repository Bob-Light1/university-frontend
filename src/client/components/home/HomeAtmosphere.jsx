/**
 * @file HomeAtmosphere.jsx
 * @description Home-only ambient light with bounded motion and visitor controls.
 */
import { useEffect, useRef, useState } from 'react';
import { PauseRounded, PlayArrowRounded } from '@mui/icons-material';
import { useAppTranslation } from '../../../hooks/useAppTranslation';

const PAUSE_KEY = 'erp_home_motion_paused';
const DRIFTS = [
  { duration: 48000, x: 64, y: -36 },
  { duration: 62000, x: -52, y: 48 },
  { duration: 54000, x: 38, y: 56 },
];

/** Persist an optional presentation preference even when storage is unavailable. */
function readPaused() {
  try { return sessionStorage.getItem(PAUSE_KEY) === 'true'; }
  catch { return false; }
}

/** Render decorative light independently of content, focus and business state. */
export default function HomeAtmosphere() {
  const { t } = useAppTranslation('home');
  const fieldRef = useRef(null);
  const playbackRef = useRef(null);
  const [paused, setPaused] = useState(readPaused);

  useEffect(() => {
    const field = fieldRef.current;
    const home = field.parentElement;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const animations = Array.from(field.children, (layer, index) => {
      const { duration, x, y } = DRIFTS[index];
      const animation = layer.animate([
        { transform: `translate3d(${-x / 2}px, ${-y / 2}px, 0) scale(1)` },
        { transform: `translate3d(${x}px, ${y}px, 0) scale(1.06)` },
      ], { duration, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
      animation.pause();
      return animation;
    });
    let userPaused = readPaused();
    let visible = false;
    let canReact = false;
    let frame = 0;
    let lastFrame = 0;
    let lastPointer = null;
    let impulse = 0;
    let rate = 1;

    const tick = now => {
      // Throttle rate adjustment; the compositor still animates at display refresh.
      const elapsed = Math.min(now - lastFrame, 100);
      if (elapsed >= 32) {
        lastFrame = now;
        impulse *= Math.exp(-elapsed / 850);
        rate += (1 + impulse - rate) * (1 - Math.exp(-elapsed / 420));
        animations.forEach(animation => animation.updatePlaybackRate(rate));
      }
      if (impulse < 0.001 && Math.abs(rate - 1) < 0.001) {
        animations.forEach(animation => animation.updatePlaybackRate(1));
        frame = 0;
      } else {
        frame = requestAnimationFrame(tick);
      }
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      impulse = 0;
      rate = 1;
      lastPointer = null;
      const active = !userPaused && !reduced.matches && !document.hidden && visible;
      animations.forEach(animation => {
        animation.updatePlaybackRate(1);
        if (active) animation.play();
        else animation.pause();
      });
      canReact = active;
    };
    playbackRef.current = value => { userPaused = value; sync(); };
    const move = event => {
      if (!canReact || event.pointerType !== 'mouse') return;
      const now = performance.now();
      if (lastPointer) {
        const distance = Math.hypot(event.clientX - lastPointer.x, event.clientY - lastPointer.y);
        const velocity = distance / Math.max(now - lastPointer.time, 16);
        impulse = Math.min(0.65, impulse + velocity * 0.12);
      }
      lastPointer = { x: event.clientX, y: event.clientY, time: now };
      if (!frame && impulse > 0) {
        lastFrame = now;
        frame = requestAnimationFrame(tick);
      }
    };
    const leave = () => { lastPointer = null; impulse = 0; };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(home);
    home.addEventListener('pointermove', move, { passive: true });
    home.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      playbackRef.current = null;
      animations.forEach(animation => animation.cancel());
      home.removeEventListener('pointermove', move);
      home.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', sync);
      reduced.removeEventListener('change', sync);
    };
  }, []);

  useEffect(() => { playbackRef.current?.(paused); }, [paused]);

  const toggle = () => {
    const next = !paused;
    setPaused(next);
    try { sessionStorage.setItem(PAUSE_KEY, String(next)); }
    catch { /* The current-page control remains usable without storage. */ }
  };

  return <>
    <div ref={fieldRef} className="home-atmosphere" aria-hidden="true">
      <div className="home-atmosphere-sage" />
      <div className="home-atmosphere-blue" />
      <div className="home-atmosphere-amber" />
    </div>
    <button type="button" className="home-atmosphere-toggle" onClick={toggle}
      aria-label={t(paused ? 'resumeBackground' : 'pauseBackground')}
      title={t(paused ? 'resumeBackground' : 'pauseBackground')}>
      {paused ? <PlayArrowRounded fontSize="inherit" /> : <PauseRounded fontSize="inherit" />}
    </button>
  </>;
}
