/**
 * A calm, CSS-driven night sky rendered behind everything.
 *
 * Star positions are derived deterministically from the index (a tiny hash),
 * so the server and client render identically — no hydration mismatch and no
 * randomness. The twinkle animation is disabled under prefers-reduced-motion
 * via CSS in globals.css.
 */

const STAR_COUNT = 70;

/** Deterministic pseudo-random in [0, 1) from an integer seed. */
function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export default function Starfield() {
  const stars = Array.from({ length: STAR_COUNT }, (_, i) => {
    const left = rand(i + 1) * 100;
    const top = rand(i + 101) * 100;
    const size = 1 + rand(i + 201) * 2.2;
    const duration = 3 + rand(i + 301) * 5;
    const delay = rand(i + 401) * 5;
    return { left, top, size, duration, delay, key: i };
  });

  return (
    <div className="starfield" aria-hidden="true">
      {stars.map((s) => (
        <span
          key={s.key}
          className="star"
          style={
            {
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              "--tw-dur": `${s.duration}s`,
              "--tw-delay": `${s.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
      <div className="moon" />
    </div>
  );
}
