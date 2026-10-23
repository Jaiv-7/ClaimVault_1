import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Boxes, Calendar, Car, Cpu, Laptop, LayoutGrid, List, Plus, Refrigerator, Search, SlidersHorizontal, Star, Upload } from 'lucide-react';
import { api } from './api';
import { useApp } from './App.jsx';
import { Badge, CATS, Modal, Skeletons, fmt, money, toast } from './ui.jsx';

const icons = { Electronics: Cpu, Appliances: Refrigerator, Vehicles: Car, Office: Laptop, Other: Boxes };

export function Card({ p }) {
  const { bump } = useApp();
  const nav = useNavigate();
  const Icon = icons[p.category] || Boxes;
  const star = async e => {
    e.stopPropagation();
    try { await api(`/products/${p.id}/bookmark`, { method: 'PATCH' }); bump(); } catch (x) { toast(x.message, true); }
  };
  return (
    <div className="card asset" onClick={() => nav('/products/' + p.id)}>
      <div className="row">
        <span className="tile blue lg"><Icon size={24} /></span>
        <div className="grow"><b>{p.title}</b><small>{p.brand}</small></div>
        <button className={'icon star' + (p.isBookmarked ? ' on' : '')} onClick={star} aria-label="Pin asset"><Star size={20} fill={p.isBookmarked ? 'currentColor' : 'none'} /></button>
      </div>
      <div className="row between"><Badge s={p.status} /><code>{p.serialNumber}</code></div>
      <div className="row between foot"><span className="muted"><Calendar size={16} /> {fmt(p.purchaseDate)}</span><b>{money(p.price)}</b></div>
    </div>
  );
}

export default function Vault() {
  const { rev, openAdd } = useApp();
  const [items, setItems] = useState(null);
  const [q, setQ] = useState(''), [cat, setCat] = useState('All'), [st, setSt] = useState('All'), [view, setView] = useState('grid');

  useEffect(() => {
    const t = setTimeout(() => api('/products?' + new URLSearchParams({ search: q, category: cat, status: st })).then(setItems).catch(e => toast(e.message, true)), 200);
    return () => clearTimeout(t);
  }, [q, cat, st, rev]);

  const pills = (opts, val, set, cls) => opts.map(o => <button key={o} className={`pill ${cls} ${val === o ? 'on' : ''}`} onClick={() => set(o)}>{o}</button>);
  return (
    <>
      <header className="head">
        <div><h1>My Vault</h1><p className="muted">{items ? `${items.length} asset${items.length === 1 ? '' : 's'} found` : 'Loading…'}</p></div>
        <div className="row">
          <div className="toggle">
            <button className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')} aria-label="Grid view"><LayoutGrid size={18} /></button>
            <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')} aria-label="List view"><List size={18} /></button>
          </div>
          <button className="btn primary" onClick={() => openAdd()}><Plus size={18} />Add Asset</button>
        </div>
      </header>
      <div className="field search"><Search size={18} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by product, brand or serial number…" /></div>
      <div className="row wrap gap">{pills(['All', ...CATS], cat, setCat, 'lg')}</div>
      <div className="row wrap gap"><SlidersHorizontal size={18} className="muted" />{pills(['All', 'Active', 'Expiring Soon', 'Expired'], st, setSt, '')}</div>
      {!items ? <Skeletons n={3} /> : items.length ? (
        <div className={'assets ' + view}>{items.map(p => <Card key={p.id} p={p} />)}</div>
      ) : (
        <div className="empty dashed">
          <Boxes size={40} className="muted" />
          <h3>{q || cat !== 'All' || st !== 'All' ? 'No assets match your filters' : 'Your vault is empty'}</h3>
          <p className="muted">{q || cat !== 'All' || st !== 'All' ? 'Try a different search or clear the filters.' : 'Add your first purchase to start tracking its warranty.'}</p>
          {q || cat !== 'All' || st !== 'All'
            ? <button className="btn" onClick={() => { setQ(''); setCat('All'); setSt('All'); }}>Clear filters</button>
            : <button className="btn primary" onClick={() => openAdd()}>Add Asset</button>}
        </div>
      )}
    </>
  );
}

export function AssetModal({ asset, onClose }) {
  const { bump } = useApp();
  const edit = !!asset;
  const [f, setF] = useState({
    title: asset?.title || '', brand: asset?.brand || '', category: asset?.category || '', serialNumber: asset?.serialNumber || '',
    purchaseDate: asset ? asset.purchaseDate.slice(0, 10) : '', warrantyMonths: asset?.warrantyMonths || '', price: asset?.price ?? ''
  });
  const [receipt, setReceipt] = useState(undefined);
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);
  const file = useRef();
  const set = k => e => setF({ ...f, [k]: e.target.value });

  const pick = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1e6) return toast('Receipt must be under 1 MB', true);
    const r = new FileReader();
    r.onload = () => { setReceipt(r.result); setFileName(file.name); };
    r.readAsDataURL(file);
  };
  const submit = async e => {
    e.preventDefault();
    if (!f.serialNumber.trim()) return toast('Serial number cannot be empty', true);
    if (isNaN(new Date(f.purchaseDate))) return toast('Enter a valid purchase date', true);
    setBusy(true);
    try {
      await api(edit ? '/products/' + asset.id : '/products', { method: edit ? 'PUT' : 'POST', body: { ...f, receipt } });
      toast(edit ? 'Asset updated!' : 'Asset added!');
      bump(); onClose();
    } catch (x) { toast(x.message, true); setBusy(false); }
  };

  return (
    <Modal title={edit ? 'Edit Asset' : 'Add New Asset'} sub={edit ? 'Update the details of this purchase.' : 'Register a new purchase to start tracking its warranty window.'} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <label>Product Name *<input value={f.title} onChange={set('title')} placeholder="e.g. MacBook Pro 14" required autoFocus /></label>
        <div className="two">
          <label>Brand *<input value={f.brand} onChange={set('brand')} placeholder="e.g. Apple" required /></label>
          <label>Category *<select value={f.category} onChange={set('category')} required><option value="" disabled>Select category</option>{CATS.map(c => <option key={c}>{c}</option>)}</select></label>
        </div>
        <label>Serial Number *<input className="mono" value={f.serialNumber} onChange={set('serialNumber')} placeholder="e.g. C02XK1ABEJG5" required /></label>
        <div className="two">
          <label>Purchase Date *<input type="date" value={f.purchaseDate} onChange={set('purchaseDate')} required /></label>
          <label>Warranty (months) *<input type="number" min="1" value={f.warrantyMonths} onChange={set('warrantyMonths')} placeholder="e.g. 24" required /></label>
        </div>
        <label>Purchase Price (USD) *<input type="number" min="0" step="0.01" value={f.price} onChange={set('price')} placeholder="e.g. 2499.00" required /></label>
        <div className="drop">
          <span className="muted">Invoice / Receipt</span>
          <input ref={file} type="file" accept="image/*,application/pdf" onChange={pick} hidden />
          <div className="row"><button type="button" className="btn" onClick={() => file.current.click()}><Upload size={16} />Attach file</button>
            <small className="muted">{fileName || (edit && asset.receipt ? 'Receipt on file. Attach a new one to replace it.' : 'Image or PDF, up to 1 MB')}</small></div>
        </div>
        <div className="row end"><button type="button" className="btn" onClick={onClose}>Cancel</button><button className="btn primary" disabled={busy}>{edit ? 'Save changes' : 'Add asset'}</button></div>
      </form>
    </Modal>
  );
}
