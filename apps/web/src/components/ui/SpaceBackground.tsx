import { useEffect, useState } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
}

export function SpaceBackground() {
  const [slowStars, setSlowStars] = useState<Star[]>([]);
  const [fastStars, setFastStars] = useState<Star[]>([]);

  useEffect(() => {
    // Generate slow background stars
    const slow = Array.from({ length: 60 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 0.9 + 0.5,
      opacity: Math.random() * 0.5 + 0.2,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 5,
    }));
    // Generate faster foreground stars
    const fast = Array.from({ length: 40 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.5 + 0.9,
      opacity: Math.random() * 0.7 + 0.3,
      duration: Math.random() * 2 + 1.5,
      delay: Math.random() * 4,
    }));
    setSlowStars(slow);
    setFastStars(fast);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[var(--bg-color)] transition-colors duration-500">
      {/* Nebulae */}
      <div 
        className="absolute -top-[20%] -left-[20%] w-[100%] h-[100%] rounded-full bg-indigo-500/10 blur-[130px]" 
        style={{ animation: 'ambient-spin-1 30s infinite linear, pulse 7s infinite ease-in-out' }} 
      />
      <div 
        className="absolute -bottom-[20%] -right-[20%] w-[100%] h-[100%] rounded-full bg-fuchsia-500/10 blur-[130px]" 
        style={{ animation: 'ambient-spin-2 40s infinite linear, pulse 9s infinite ease-in-out' }} 
      />
      <div 
        className="absolute top-[20%] left-[10%] w-[80%] h-[80%] rounded-full bg-cyan-500/5 blur-[120px]" 
        style={{ animation: 'ambient-spin-1 50s infinite linear, pulse 11s infinite ease-in-out' }} 
      />

      {/* Layer 1: Slow star drift */}
      <div className="absolute inset-0 w-full h-[200%]" style={{ animation: 'star-drift 120s infinite linear' }}>
        <svg className="absolute top-0 left-0 w-full h-[50%]">
          {slowStars.map((star, idx) => (
            <circle
              key={`slow-1-${idx}`}
              cx={`${star.x}%`}
              cy={`${star.y}%`}
              r={star.size}
              fill="currentColor"
              className="text-slate-400/60 dark:text-white/60 animate-pulse"
              opacity={star.opacity}
              style={{
                animationDuration: `${star.duration}s`,
                animationDelay: `${star.delay}s`,
              }}
            />
          ))}
        </svg>
        <svg className="absolute top-[50%] left-0 w-full h-[50%]">
          {slowStars.map((star, idx) => (
            <circle
              key={`slow-2-${idx}`}
              cx={`${star.x}%`}
              cy={`${star.y}%`}
              r={star.size}
              fill="currentColor"
              className="text-slate-400/60 dark:text-white/60 animate-pulse"
              opacity={star.opacity}
              style={{
                animationDuration: `${star.duration}s`,
                animationDelay: `${star.delay}s`,
              }}
            />
          ))}
        </svg>
      </div>

      {/* Layer 2: Fast star drift */}
      <div className="absolute inset-0 w-full h-[200%]" style={{ animation: 'star-drift 70s infinite linear' }}>
        <svg className="absolute top-0 left-0 w-full h-[50%]">
          {fastStars.map((star, idx) => (
            <circle
              key={`fast-1-${idx}`}
              cx={`${star.x}%`}
              cy={`${star.y}%`}
              r={star.size}
              fill="currentColor"
              className="text-slate-400/80 dark:text-white animate-pulse"
              opacity={star.opacity}
              style={{
                animationDuration: `${star.duration}s`,
                animationDelay: `${star.delay}s`,
              }}
            />
          ))}
        </svg>
        <svg className="absolute top-[50%] left-0 w-full h-[50%]">
          {fastStars.map((star, idx) => (
            <circle
              key={`fast-2-${idx}`}
              cx={`${star.x}%`}
              cy={`${star.y}%`}
              r={star.size}
              fill="currentColor"
              className="text-slate-400/80 dark:text-white animate-pulse"
              opacity={star.opacity}
              style={{
                animationDuration: `${star.duration}s`,
                animationDelay: `${star.delay}s`,
              }}
            />
          ))}
        </svg>
      </div>

      {/* Solar System Layer */}
      <svg viewBox="0 0 1200 900" className="absolute inset-0 w-full h-full opacity-45 dark:opacity-40">
        <defs>
          <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
            <stop offset="20%" stopColor="#f59e0b" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#ea580c" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Sun in the top-left (e.g. x=180, y=220) */}
        <circle cx="180" cy="220" r="70" fill="url(#sun-glow)" className="animate-pulse" style={{ animationDuration: '4s' }} />
        <circle cx="180" cy="220" r="16" fill="#fef08a" className="shadow-lg shadow-amber-500" />

        {/* Orbits and Orbiting Planets */}
        
        {/* Orbit 1: Inner Planet (Mercury-like Cyan) */}
        <circle cx="180" cy="220" r="110" fill="none" stroke="currentColor" strokeDasharray="3 4" className="text-slate-400/20 dark:text-white/10" strokeWidth="1" />
        <g style={{ transformOrigin: '180px 220px', animation: 'solar-orbit 20s infinite linear' }}>
          <circle cx="290" cy="220" r="5" fill="#38bdf8" className="shadow-md shadow-sky-500" />
        </g>

        {/* Orbit 2: Green Earth-like Planet */}
        <circle cx="180" cy="220" r="200" fill="none" stroke="currentColor" strokeDasharray="3 4" className="text-slate-400/20 dark:text-white/10" strokeWidth="1" />
        <g style={{ transformOrigin: '180px 220px', animation: 'solar-orbit 38s infinite linear' }}>
          <circle cx="380" cy="220" r="9" fill="#34d399" className="shadow-md shadow-emerald-500" />
          {/* Moon orbiting the Earth */}
          <g style={{ transformOrigin: '380px 220px', animation: 'solar-orbit 6s infinite linear' }}>
            <circle cx="395" cy="220" r="2" fill="#e2e8f0" />
          </g>
        </g>

        {/* Orbit 3: Giant Ringed Saturn-like Planet */}
        <circle cx="180" cy="220" r="320" fill="none" stroke="currentColor" strokeDasharray="3 4" className="text-slate-400/20 dark:text-white/10" strokeWidth="1" />
        <g style={{ transformOrigin: '180px 220px', animation: 'solar-orbit 65s infinite linear' }}>
          <circle cx="500" cy="220" r="14" fill="#fb923c" className="shadow-md shadow-orange-500" />
          <ellipse cx="500" cy="220" rx="22" ry="6" fill="none" stroke="#fb923c" strokeWidth="1.5" transform="rotate(-15 500 220)" opacity="0.75" />
        </g>

        {/* Orbit 4: Outer Purple Planet */}
        <circle cx="180" cy="220" r="460" fill="none" stroke="currentColor" strokeDasharray="3 4" className="text-slate-400/20 dark:text-white/10" strokeWidth="1" />
        <g style={{ transformOrigin: '180px 220px', animation: 'solar-orbit 110s infinite linear' }}>
          <circle cx="640" cy="220" r="11" fill="#c084fc" className="shadow-md shadow-fuchsia-500" />
        </g>

        {/* Orbit 5: Distant Red Planet */}
        <circle cx="180" cy="220" r="620" fill="none" stroke="currentColor" strokeDasharray="3 4" className="text-slate-400/20 dark:text-white/10" strokeWidth="1" />
        <g style={{ transformOrigin: '180px 220px', animation: 'solar-orbit 170s infinite linear' }}>
          <circle cx="800" cy="220" r="8" fill="#f43f5e" className="shadow-md shadow-rose-500" />
        </g>
      </svg>
    </div>
  );
}
