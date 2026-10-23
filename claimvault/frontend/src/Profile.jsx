import { useEffect, useState } from 'react';
import { Boxes, CloudUpload, FileWarning, HardDrive, LogOut, Moon, ShieldCheck, Sun, Wrench } from 'lucide-react';
import { api } from './api';
import { useApp } from './App.jsx';
import { money, toast } from './ui.jsx';

const QUOTA = 200 * 1024 * 1024;
const size = b => (b < 1048576 ? Math.round(b / 1024) + ' KB' : (b / 1048576).toFixed(1) + ' MB');

export default function Profile() {
  const { user, setUser, logout, theme, setTheme, rev } = useApp();
  const [s, setS] = useState(null);
  const [name, setName] = useState(user.name);
  const [pw, setPw] = useState({ current: '', next: '' });
  useEffect(() => { api('/stats').then(setS).catch(e => toast(e.message, true)); }, [rev]);

  const saveName = async () => {
    try { setUser(await api('/auth/name', { method: 'PUT', body: { name } })); toast('Name updated!'); } catch (x) { toast(x.message, true); }
  };
  const savePw = async () => {
    try { await api('/auth/password', { method: 'PUT', body: pw }); setPw({ current: '', next: '' }); toast('Password updated!'); } catch (x) { toast(x.message, true); }
  };
  const stats = s && [
    ['Assets Protected', Boxes, s.assets, money(s.value)],
    ['Claims Filed', FileWarning, user.claimsFiled, 'All time'],
    ['Repairs Logged', Wrench, s.repairs, 'Service events'],
  ];

  return (
    <>
      <header className="head"><div><h1>Profile &amp; Settings</h1><p className="muted">Manage your account, review vault usage and set your theme.</p></div></header>
      <div className="card row between profile">
        <div className="row gap"><span className="avatar">{user.name[0].toUpperCase()}</span>
          <div><h3>{user.name}</h3><p className="muted">{user.email}</p><small className="muted">Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</small></div></div>
        <button className="btn danger" onClick={logout}><LogOut size={16} />Sign out</button>
      </div>
      <div className="stats">
        {(stats || [[], [], []]).map(([label, I, n, sub], i) => I ? (
          <div className="card stat" key={label}><div className="row between"><span className="muted">{label}</span><I size={18} color="#2563eb" /></div><b className="big">{n}</b><span className="muted">{sub}</span></div>
        ) : <div className="skel" key={i} />)}
        <div className="card stat"><div className="row between"><span className="muted">Storage Quota</span><HardDrive size={18} color="#2563eb" /></div>
          <b className="big">{s ? size(s.bytes) : '–'} <small className="muted">/ 200.0 MB</small></b>
          <div className="bar"><i style={{ width: s ? Math.max(2, (s.bytes / QUOTA) * 100) + '%' : 0 }} /></div></div>
      </div>
      <div className="two cards">
        <div className="card form"><h3 className="sec"><ShieldCheck size={20} color="#2563eb" />Display Name</h3>
          <label>Name<input value={name} onChange={e => setName(e.target.value)} /></label>
          <div><button className="btn primary" onClick={saveName}>Save Name</button></div></div>
        <div className="card form"><h3 className="sec"><CloudUpload size={20} color="#2563eb" />Change Password</h3>
          <label>Current Password<input type="password" value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} /></label>
          <label>New Password<input type="password" placeholder="At least 8 characters" value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} /></label>
          <div><button className="btn primary" onClick={savePw}>Update Password</button></div></div>
      </div>
      <div className="card"><h3>Appearance</h3><p className="muted">Choose the interface theme for ClaimVault.</p>
        <div className="row gap">
          <button className={'btn' + (theme === 'light' ? ' sel' : '')} onClick={() => setTheme('light')}><Sun size={16} />Light</button>
          <button className={'btn' + (theme === 'dark' ? ' sel' : '')} onClick={() => setTheme('dark')}><Moon size={16} />Dark</button>
        </div></div>
    </>
  );
}
