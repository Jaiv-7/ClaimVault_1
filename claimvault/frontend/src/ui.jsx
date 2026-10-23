import { useEffect, useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';

export const CATS = ['Electronics', 'Appliances', 'Vehicles', 'Office', 'Other'];
export const money = (n, d = 2) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: d, maximumFractionDigits: d }).format(n || 0);
export const fmt = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
export const ago = d => {
  const s = (Date.now() - new Date(d)) / 1000;
  return s < 60 ? 'just now' : s < 3600 ? Math.floor(s / 60) + 'm ago' : s < 86400 ? Math.floor(s / 3600) + 'h ago' : Math.floor(s / 86400) + 'd ago';
};
export const toast = (m, err) => window.dispatchEvent(new CustomEvent('toast', { detail: { m, err } }));

export const Logo = () => (
  <div className="logo"><span className="logo-mark"><ShieldCheck size={22} /></span><b>Claim<i>Vault</i></b></div>
);
export const Badge = ({ s }) => <span className={'badge ' + s.replace(' ', '')}><u />{s}</span>;

export function Modal({ title, sub, wide, onClose, children }) {
  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={'modal' + (wide ? ' wide' : '')}>
        <button className="x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <h2>{title}</h2>
        {sub && <p className="muted">{sub}</p>}
        {children}
      </div>
    </div>
  );
}

export function Skeletons({ n = 3 }) {
  return <div className="assets">{Array.from({ length: n }, (_, i) => <div key={i} className="skel" />)}</div>;
}

export function Toasts() {
  const [list, setList] = useState([]);
  useEffect(() => {
    const on = e => {
      const t = { ...e.detail, id: Math.random() };
      setList(l => [...l, t]);
      setTimeout(() => setList(l => l.filter(x => x !== t)), 3200);
    };
    window.addEventListener('toast', on);
    return () => window.removeEventListener('toast', on);
  }, []);
  return <div className="toasts">{list.map(t => <div key={t.id} className={'toast' + (t.err ? ' err' : '')}>{t.m}</div>)}</div>;
}

export function CountUp({ to, format = n => Math.round(n) }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return setV(to);
    let raf, t0;
    const step = t => {
      t0 ??= t;
      const k = Math.min(1, (t - t0) / 700);
      setV(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{format(v)}</>;
}
