import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { Logo, fmt, money } from './ui.jsx';

const COMPANY = { name: 'ClaimVault', unit: 'Verification Desk', signatory: 'Authorised Signatory' };

const sha = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))]
  .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
const kv = rows => rows.map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>);

export default function Claim({ p, user }) {
  const [issued] = useState(() => new Date());
  const [code, setCode] = useState('');
  const left = Math.ceil((new Date(p.expiryDate) - issued) / 864e5);
  const covered = left >= 0;
  const ref = `CV-${issued.getFullYear()}-${String(user.claimsFiled).padStart(4, '0')}-${p.id.slice(-4).toUpperCase()}`;
  const checks = [['Serial number recorded', !!p.serialNumber], ['Proof of purchase attached', !!p.receipt], ['Within warranty period', covered]];

  useEffect(() => {
    const data = [ref, user.email, p.id, p.serialNumber, p.purchaseDate, p.expiryDate, p.price, p.repairLogs.length, issued.toISOString()].join('|');
    sha(data).then(setCode).catch(() => setCode(''));
  }, []);

  return (
    <div className="doc">
      <div className="doc-head">
        <div><Logo /><h3>Warranty Repair Claim Report</h3></div>
        <div className="meta"><b>{ref}</b>Issued {issued.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</div>
      </div>
      <div className={'st' + (covered ? '' : ' no')}>{covered ? `WARRANTY ACTIVE · ${left} days remaining` : `WARRANTY EXPIRED · ${-left} days ago`}</div>
      <section><h4>1. Claimant</h4><div className="kv">{kv([['Name', user.name], ['Email', user.email], ['Account ID', user.id.slice(-8).toUpperCase()]])}</div></section>
      <section><h4>2. Product</h4><div className="kv">{kv([['Product', p.title], ['Brand', p.brand], ['Category', p.category], ['Serial number', p.serialNumber],
        ['Purchase date', fmt(p.purchaseDate)], ['Purchase price', money(p.price)], ['Warranty period', `${p.warrantyMonths} months`], ['Warranty expiry', fmt(p.expiryDate)]])}</div></section>
      <section><h4>3. Eligibility and proof of purchase</h4>
        <div className="checks">{checks.map(([t, ok]) => <span key={t} className={ok ? 'ok' : 'no'}>{ok ? <Check size={14} /> : <X size={14} />}{t}</span>)}</div>
        {p.receipt.startsWith('data:image') && <img className="receipt-img" src={p.receipt} alt="Invoice" />}
      </section>
      <section><h4>4. Service history</h4>
        {p.repairLogs.length ? <div className="tbl"><table><thead><tr><th>Date</th><th>Technician</th><th>Work done</th><th>Cover</th><th>Cost</th></tr></thead><tbody>
          {[...p.repairLogs].sort((a, b) => new Date(a.serviceDate) - new Date(b.serviceDate)).map(r => (
            <tr key={r._id}><td>{fmt(r.serviceDate)}</td><td>{r.technicianName}</td><td>{r.description}</td><td>{r.coveredUnderWarranty ? 'Warranty' : 'Paid'}</td><td>{money(r.cost)}</td></tr>
          ))}
          <tr><td colSpan="4"><b>Total repair cost</b></td><td><b>{money(p.repairLogs.reduce((n, r) => n + r.cost, 0))}</b></td></tr></tbody></table></div>
          : <p>No previous repairs are recorded for this product.</p>}
      </section>
      <section><h4>5. Declaration</h4><p>The claimant declares that the product above was purchased on the stated date, that the serial number is correct, and that the information in this report is accurate to the best of their knowledge.</p></section>
      <div className="sign">
        <div><div className="sig">{COMPANY.name}</div><b>{COMPANY.signatory}</b><div className="fine">{COMPANY.unit} · digitally signed {fmt(issued)}</div></div>
        <svg className="seal" viewBox="0 0 120 120" fill="none" stroke="currentColor">
          <defs><path id="seal-path" d="M60 60 m-45 0 a45 45 0 1 1 90 0 a45 45 0 1 1 -90 0" /></defs>
          <circle cx="60" cy="60" r="57" strokeWidth="2" /><circle cx="60" cy="60" r="33" strokeWidth="1" />
          <text fill="currentColor" stroke="none" fontSize="9" fontWeight="700"><textPath href="#seal-path" textLength="276" lengthAdjust="spacing">VERIFIED BY CLAIMVAULT • DIGITALLY SIGNED •</textPath></text>
          <path d="M45 61 l11 11 l21 -24" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="verify"><h4>Verification code</h4><div className="code">{code ? code.match(/.{1,8}/g).join(' ') : 'Unavailable in this browser'}</div><div className="fine">SHA-256 fingerprint of the claim data above</div></div>
      </div>
      <p className="fine">Generated from records stored in the claimant’s ClaimVault account. Any change to the data changes the verification code. This report supports, and does not replace, the manufacturer’s own claim process.</p>
    </div>
  );
}
