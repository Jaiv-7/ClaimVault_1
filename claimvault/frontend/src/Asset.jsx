import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Pencil, Printer, Trash2, Wrench } from 'lucide-react';
import { api } from './api';
import { useApp } from './App.jsx';
import Claim from './Claim.jsx';
import { AssetModal } from './Vault.jsx';
import { Badge, Modal, Skeletons, fmt, money, toast } from './ui.jsx';

function RepairModal({ id, onClose, onDone }) {
  const [f, setF] = useState({ serviceDate: new Date().toISOString().slice(0, 10), technicianName: '', cost: 0, description: '', coveredUnderWarranty: true });
  const set = k => e => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const submit = async e => {
    e.preventDefault();
    try { onDone(await api(`/products/${id}/repairs`, { method: 'POST', body: f })); toast('Repair logged!'); onClose(); }
    catch (x) { toast(x.message, true); }
  };
  return (
    <Modal title="Log repair" sub="Record a service visit for this asset." onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <div className="two">
          <label>Service Date *<input type="date" value={f.serviceDate} onChange={set('serviceDate')} required /></label>
          <label>Repair Cost (USD)<input type="number" min="0" step="0.01" value={f.cost} onChange={set('cost')} /></label>
        </div>
        <label>Technician Name *<input value={f.technicianName} onChange={set('technicianName')} required /></label>
        <label>Description *<textarea rows="3" value={f.description} onChange={set('description')} required /></label>
        <label className="check"><input type="checkbox" checked={f.coveredUnderWarranty} onChange={set('coveredUnderWarranty')} />Covered under warranty</label>
        <div className="row end"><button type="button" className="btn" onClick={onClose}>Cancel</button><button className="btn primary">Save repair</button></div>
      </form>
    </Modal>
  );
}

export default function Asset() {
  const { id } = useParams();
  const { user, setUser, bump } = useApp();
  const nav = useNavigate();
  const [p, setP] = useState(null);
  const [modal, setModal] = useState(null);
  useEffect(() => { api('/products/' + id).then(setP).catch(e => { toast(e.message, true); nav('/vault'); }); }, [id]);

  if (!p) return <Skeletons n={3} />;
  const left = Math.ceil((new Date(p.expiryDate) - Date.now()) / 864e5);
  const remove = async () => {
    try { await api('/products/' + id, { method: 'DELETE' }); toast('Record removed'); bump(); nav('/vault'); }
    catch (x) { toast(x.message, true); }
  };
  const claim = async () => {
    try { const d = await api(`/products/${id}/claim`, { method: 'POST' }); setUser({ ...user, claimsFiled: d.claimsFiled }); setModal('claim'); }
    catch (x) { toast(x.message, true); }
  };
  const info = [['Serial Number', <code>{p.serialNumber}</code>], ['Brand', p.brand], ['Category', p.category], ['Purchase Price', money(p.price)],
    ['Purchase Date', fmt(p.purchaseDate)], ['Warranty', `${p.warrantyMonths} months`], ['Expires', fmt(p.expiryDate)],
    ['Time Left', left < 0 ? `Expired ${-left} days ago` : `${left} days`]];

  return (
    <>
      <Link to="/vault" className="back"><ArrowLeft size={16} />Back</Link>
      <header className="head">
        <div><h1>{p.title}</h1><Badge s={p.status} /></div>
        <div className="row wrap">
          <button className="btn primary" onClick={claim}><FileText size={16} />Lodge Claim</button>
          {p.receipt && <button className="btn" onClick={() => setModal('receipt')}>View receipt</button>}
          <button className="btn" onClick={() => setModal('edit')}><Pencil size={16} />Edit</button>
          <button className="btn danger" onClick={() => setModal('delete')}><Trash2 size={16} />Delete</button>
        </div>
      </header>
      <div className="card info">{info.map(([k, v]) => <div key={k}><span className="muted">{k}</span><b>{v}</b></div>)}</div>
      <h3 className="sec between">Maintenance timeline <button className="btn" onClick={() => setModal('repair')}><Wrench size={16} />Log repair</button></h3>
      {p.repairLogs.length ? <div className="card timeline">{[...p.repairLogs].sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate)).map(r => (
        <div key={r._id}><b>{r.description}</b><small>{fmt(r.serviceDate)} · {r.technicianName} · {money(r.cost)} · {r.coveredUnderWarranty ? 'Under warranty' : 'Paid by owner'}</small></div>
      ))}</div> : <div className="empty dashed"><p className="muted">No repairs recorded for this asset yet.</p></div>}

      {modal === 'edit' && <AssetModal asset={p} onClose={() => { setModal(null); api('/products/' + id).then(setP); }} />}
      {modal === 'repair' && <RepairModal id={id} onClose={() => setModal(null)} onDone={setP} />}
      {modal === 'receipt' && <Modal title="Receipt" onClose={() => setModal(null)}>
        {p.receipt.startsWith('data:application/pdf') ? <iframe className="receipt" src={p.receipt} title="Receipt" /> : <img className="receipt" src={p.receipt} alt="Receipt" />}
      </Modal>}
      {modal === 'delete' && <Modal title="Delete asset" onClose={() => setModal(null)}>
        <p>Are you sure you want to remove this record?</p>
        <div className="row end"><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn danger-solid" onClick={remove}>Delete</button></div>
      </Modal>}
      {modal === 'claim' && createPortal(
        <Modal title="Repair claim report" wide onClose={() => setModal(null)}>
          <Claim p={p} user={user} />
          <div className="row end noprint"><button className="btn" onClick={() => setModal(null)}>Close</button><button className="btn primary" onClick={() => window.print()}><Printer size={16} />Print or save as PDF</button></div>
        </Modal>, document.body)}
    </>
  );
}
