import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  src: string;
  poster: string;
  label: string; // describes the footage for screen readers
  caption?: string;
  className?: string;
}

/** play() returns a Promise in modern browsers but nothing in some older ones. */
function tryPlay(v: HTMLVideoElement, onFail: () => void) {
  try {
    const result = v.play() as Promise<void> | undefined;
    result?.catch(onFail);
  } catch {
    onFail();
  }
}

function prefersStill(): boolean {
  if (typeof window === 'undefined') return true;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  return Boolean(reducedMotion || saveData);
}

/**
 * Silent looping background clip. Visitors who ask for reduced motion or data saving
 * get the poster frame only, and everyone gets a pause button (WCAG 2.2.2).
 */
export default function HeroVideo({ src, poster, label, caption, className = '' }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [still] = useState(prefersStill);
  const [playing, setPlaying] = useState(!still);

  useEffect(() => {
    const v = ref.current;
    if (!v || still) return;
    // Some browsers ignore the autoplay attribute until play() is called; if they
    // still refuse (e.g. battery saver), show the play button instead.
    tryPlay(v, () => setPlaying(false));
  }, [still]);

  function toggle() {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      tryPlay(v, () => setPlaying(false)); // onPlay updates the button when it starts
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {still ? (
        <img src={poster} alt={label} className="h-full w-full object-cover" />
      ) : (
        <video
          ref={ref}
          className="h-full w-full object-cover"
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          aria-label={label}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      )}
      {caption && (
        <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-forest-dark/70 via-forest-dark/25 to-transparent pt-6 pr-16 pb-16 pl-6">
          <p className="font-display text-2xl leading-snug text-white drop-shadow-sm sm:text-3xl">{caption}</p>
        </div>
      )}
      {!still && (
        <button
          type="button"
          onClick={toggle}
          // Top corner: the bottom of the frame sits under the floating WhatsApp/chat buttons on phones.
          className="absolute top-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-forest-dark/55 text-white backdrop-blur transition hover:bg-forest-dark/75"
        >
          {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
          <span className="sr-only">{playing ? 'Pause video' : 'Play video'}</span>
        </button>
      )}
    </div>
  );
}
