import { useEffect, useRef } from 'react';

export default function Stars({ light }) {
  const ref = useRef();
  useEffect(() => {
    const c = ref.current, g = c.getContext('2d');
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w, h, stars, raf;
    const init = () => {
      w = c.width = c.offsetWidth; h = c.height = c.offsetHeight;
      stars = Array.from({ length: Math.min(170, Math.floor(w * h / 8000)) }, () => ({
        x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.2 + .3, v: Math.random() * .15 + .03, p: Math.random() * 6.28
      }));
    };
    const draw = t => {
      g.clearRect(0, 0, w, h);
      const dark = light || document.documentElement.dataset.theme === 'dark';
      g.fillStyle = dark ? '#fff' : '#2563eb';
      for (const s of stars) {
        s.y -= s.v;
        if (s.y < 0) { s.y = h; s.x = Math.random() * w; }
        g.globalAlpha = (dark ? .3 : .15) + (dark ? .6 : .3) * Math.abs(Math.sin(t / 1100 + s.p));
        g.beginPath(); g.arc(s.x, s.y, s.r, 0, 6.28); g.fill();
      }
      if (!still) raf = requestAnimationFrame(draw);
    };
    init(); raf = requestAnimationFrame(draw);
    const ro = new ResizeObserver(init); ro.observe(c);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [light]);
  return <canvas ref={ref} className="stars" />;
}
