import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, BadgeCheck, FileWarning, Pin, Plus, ShieldCheck, Upload, Wrench } from 'lucide-react';
import { api } from './api';
import { useApp } from './App.jsx';
import { Card } from './Vault.jsx';
import { CountUp, Skeletons, ago, money, toast } from './ui.jsx';

export default function Dashboard() {
  const { user, rev, openAdd } = useApp();
  const [items, setItems] = useState(null);
  const nav = useNavigate();
  useEffect(() => { api('/products').then(setItems).catch(e => toast(e.message, true)); }, [rev]);

  const h = new Date().getHours();
  const hello = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const list = items || [];
  const covered = list.filter(p => p.status !== 'Expired').length;
  const soon = list.filter(p => p.status === 'Expiring Soon').length;
  const pins = list.filter(p => p.isBookmarked);
  const activity = list.flatMap(p => [
    { icon: Upload, t: 'Asset Added', name: p.title, sub: `${p.brand} · ${money(p.price)}`, at: p.createdAt },
    ...p.repairLogs.map(r => ({ icon: Wrench, t: 'Repair Logged', name: p.title, sub: r.description, at: r.createdAt }))
  ]).sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 6);

  const stats = [
    ['Protected Value', list.reduce((n, p) => n + p.price, 0), `Across ${list.length} financial asset${list.length === 1 ? '' : 's'}`, ShieldCheck, 'blue', n => money(n, 0)],
    ['Active Warranties', covered, 'Fully covered right now', BadgeCheck, 'green'],
    ['Expiring Soon', soon, 'Within the next 30 days', AlertTriangle, 'amber'],
    ['Claims Filed', user.claimsFiled, 'Repair claims generated', FileWarning, 'red']
  ];

  return (
    <>
      <header className="head">
        <div>
          <p className="muted">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <h1>{hello}, {user.name.split(' ')[0]}</h1>
        </div>
        <button className="btn primary" onClick={() => openAdd()}><Plus size={18} />Add Asset</button>
      </header>
      <div className="stats">
        {stats.map(([l, v, s, I, c, f]) => (
          <div className="card stat" key={l}>
            <div className="row"><span className="muted">{l}</span><span className={'tile ' + c}><I size={20} /></span></div>
            <b className="big">{items ? <CountUp to={v} format={f} /> : '–'}</b><span className="muted">{s}</span>
          </div>
        ))}
      </div>
      <div className="split">
        <section>
          <h3 className="sec"><Pin size={16} color="#f59e0b" />Pinned Assets <span className="muted">({pins.length})</span></h3>
          {!items ? <Skeletons n={2} /> : pins.length ? <div className="assets">{pins.map(p => <Card key={p.id} p={p} />)}</div> : (
            <div className="empty dashed">
              <p className="muted">Nothing pinned yet. Star an asset in your vault to keep it front-and-center here.</p>
              <button className="btn" onClick={() => nav('/vault')}>Browse vault</button>
            </div>
          )}
        </section>
        <section>
          <h3 className="sec">Recent Activity</h3>
          {!items ? <Skeletons n={2} /> : activity.length ? activity.map((a, i) => (
            <div className="card act" key={i}>
              <span className="tile blue"><a.icon size={18} /></span>
              <div><span className="muted">{a.t} · </span><b>{a.name}</b><small>{a.sub} · {ago(a.at)}</small></div>
            </div>
          )) : <div className="empty dashed"><p className="muted">No activity yet. Add your first asset to get started.</p></div>}
        </section>
      </div>
    </>
  );
}
