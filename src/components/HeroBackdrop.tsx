// Decorative, slow-moving backdrop for the home page welcome text. Purely visual:
// hidden from assistive tech, ignores pointer events, and holds still when the
// visitor prefers reduced motion (see the .hero-* rules in index.css).

const PETALS = [
  { left: '8%', size: 10, delay: '0s', duration: '16s', drift: '18px' },
  { left: '22%', size: 7, delay: '5s', duration: '19s', drift: '-14px' },
  { left: '38%', size: 9, delay: '9s', duration: '17s', drift: '22px' },
  { left: '55%', size: 6, delay: '2.5s', duration: '21s', drift: '-20px' },
  { left: '70%', size: 8, delay: '12s', duration: '18s', drift: '16px' },
  { left: '86%', size: 7, delay: '7s', duration: '20s', drift: '-12px' },
];

function Sprig({ className = '', mirrored = false }: { className?: string; mirrored?: boolean }) {
  return (
    <svg viewBox="0 0 120 200" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className={className}>
      <g transform={mirrored ? 'matrix(-1 0 0 1 120 0)' : undefined}>
        <path d="M60 196C58 150 62 104 74 58 80 36 88 18 96 6" />
        <path d="M62 160c-14-6-26-18-30-34 16 2 27 13 30 34Z" />
        <path d="M64 128c13-7 22-20 24-36-15 4-23 17-24 36Z" />
        <path d="M67 98c-13-5-23-16-27-30 14 1 24 11 27 30Z" />
        <path d="M72 70c11-7 18-18 19-31-12 4-18 15-19 31Z" />
        <path d="M80 44c-10-3-18-11-21-22 11 1 18 9 21 22Z" />
      </g>
    </svg>
  );
}

export default function HeroBackdrop() {
  return (
    // No overflow clipping here: clipping the blurred orbs leaves visible hard edges.
    // The hero <section> already clips anything that drifts past the page edge.
    <div aria-hidden className="pointer-events-none absolute -inset-x-6 -inset-y-10 -z-10 sm:-inset-x-10">
      {/* Soft glowing orbs */}
      <div className="hero-orb hero-orb-a absolute -top-10 -left-16 h-72 w-72 rounded-full bg-sage/35 blur-3xl" />
      <div className="hero-orb hero-orb-b absolute top-1/3 right-0 h-64 w-64 rounded-full bg-gold-soft/70 blur-3xl" />
      <div className="hero-orb hero-orb-c absolute -bottom-12 left-1/4 h-56 w-56 rounded-full bg-sage-soft/80 blur-3xl" />

      {/* Swaying botanical line art */}
      <Sprig className="hero-sway absolute -top-2 right-2 h-48 w-28 text-sage/45 sm:right-10 sm:h-60 sm:w-36" />
      <Sprig mirrored className="hero-sway-slow absolute -bottom-6 -left-4 hidden h-40 w-24 text-gold/35 sm:block" />

      {/* Petals drifting upward */}
      {PETALS.map((p, i) => (
        <span
          key={i}
          className="hero-petal absolute bottom-0 rounded-[60%_0_60%_0] bg-gold/40"
          style={
            {
              left: p.left,
              width: p.size,
              height: p.size,
              animationDelay: p.delay,
              animationDuration: p.duration,
              '--drift': p.drift,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
