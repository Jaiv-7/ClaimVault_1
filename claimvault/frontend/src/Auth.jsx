import { useState } from 'react';
import { FileText, Lock, Mail, ShieldCheck, Upload, User } from 'lucide-react';
import { api } from './api';
import { Logo } from './ui.jsx';
import Stars from './Stars.jsx';

const perks = [
  [ShieldCheck, 'Real-time warranty tracking with 30-day expiry alerts'],
  [Upload, 'Encrypted receipt storage for every high-value asset'],
  [FileText, 'One-click, print-ready repair claim documents']
];
const ticks = ['Warranty tracking', 'Digital receipts', 'Expiry alerts', 'Claim reports', 'Maintenance history'];

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const login = mode === 'login';
  const set = k => e => setF({ ...f, [k]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const d = await api(login ? '/auth/login' : '/auth/register', { method: 'POST', body: f });
      localStorage.setItem('cv_token', d.token);
      onAuth(d.user);
    } catch (x) { setErr(x.message); setBusy(false); }
  };
  const switchTo = m => { setMode(m); setErr(''); };

  return (
    <div className="auth">
      <section className="auth-hero">
        <Stars light />
        <Logo />
        <h1>Every purchase deserves proof.</h1>
        <p>ClaimVault digitizes your invoices, tracks serial numbers and warranty windows, and generates verified repair claim reports — so a breakdown never turns into an out-of-pocket loss.</p>
        <ul>{perks.map(([I, t]) => <li key={t}><span><I size={16} /></span>{t}</li>)}</ul>
        <div className="ticker"><div>{[...ticks, ...ticks].map((t, i) => <span key={i}>✦ {t}</span>)}</div></div>
        <small>© 2026 ClaimVault. Enterprise asset protection.</small>
      </section>
      <section className="auth-form">
        <form onSubmit={submit}>
          <div className="tabs">
            <button type="button" className={login ? 'on' : ''} onClick={() => switchTo('login')}>Sign In</button>
            <button type="button" className={!login ? 'on' : ''} onClick={() => switchTo('signup')}>Create Account</button>
          </div>
          <h2>{login ? 'Welcome back' : 'Start protecting your assets'}</h2>
          <p className="muted">{login ? 'Sign in to access your warranty vault.' : 'Create your vault in under a minute.'}</p>
          {!login && <label>Full Name<div className="field"><User size={18} /><input value={f.name} onChange={set('name')} placeholder="Alex Morgan" required /></div></label>}
          <label>Email<div className="field"><Mail size={18} /><input type="email" value={f.email} onChange={set('email')} placeholder="you@example.com" required /></div></label>
          <label>Password<div className="field"><Lock size={18} /><input type="password" value={f.password} onChange={set('password')} placeholder={login ? 'Your password' : 'At least 8 characters'} minLength={login ? undefined : 8} required /></div></label>
          {err && <div className="alert">{err}</div>}
          <button className="btn primary wide" disabled={busy}>{login ? 'Sign In' : 'Create Account'}</button>
          <p className="switch">
            {login ? 'New to ClaimVault? ' : 'Already have an account? '}
            <a href="#" onClick={e => { e.preventDefault(); switchTo(login ? 'signup' : 'login'); }}>{login ? 'Create an account' : 'Sign in'}</a>
          </p>
        </form>
      </section>
    </div>
  );
}
