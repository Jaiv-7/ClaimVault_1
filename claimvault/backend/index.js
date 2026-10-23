require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { User, Product } = require('./models');

const app = express();
const api = express.Router();
app.use(express.json({ limit: '2mb' }));
app.use('/api', api);

const sign = u => jwt.sign({ id: u.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const pub = u => ({ id: u.id, name: u.name, email: u.email, claimsFiled: u.claimsFiled, createdAt: u.createdAt });
const auth = (req, res, next) => {
  try { req.uid = jwt.verify((req.headers.authorization || '').slice(7), process.env.JWT_SECRET).id; next(); }
  catch { res.status(401).json({ error: 'Please sign in again' }); }
};
const bad = (res, error, code = 400) => res.status(code).json({ error });

api.post('/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name?.trim() || !/^\S+@\S+\.\S+$/.test(email || '') || (password || '').length < 8)
    return bad(res, 'Enter your name, a valid email and a password of at least 8 characters');
  const u = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: sign(u), user: pub(u) });
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 5, skipSuccessfulRequests: true,
  message: { error: 'Too many failed attempts. Try again in 15 minutes.' }
});
api.post('/auth/login', limiter, async (req, res) => {
  const u = await User.findOne({ email: String(req.body.email || '').toLowerCase().trim() });
  if (!u || !(await bcrypt.compare(String(req.body.password || ''), u.password))) return bad(res, 'Invalid email or password', 401);
  res.json({ token: sign(u), user: pub(u) });
});

api.get('/auth/me', auth, async (req, res) => {
  const u = await User.findById(req.uid);
  u ? res.json(pub(u)) : bad(res, 'Account not found', 401);
});
api.put('/auth/name', auth, async (req, res) => {
  const u = await User.findByIdAndUpdate(req.uid, { name: req.body.name }, { new: true, runValidators: true });
  res.json(pub(u));
});
api.put('/auth/password', auth, async (req, res) => {
  const u = await User.findById(req.uid);
  const { current, next } = req.body;
  if (!(await bcrypt.compare(String(current || ''), u.password))) return bad(res, 'Current password is incorrect');
  if ((next || '').length < 8) return bad(res, 'New password must be at least 8 characters');
  u.password = await bcrypt.hash(next, 10);
  await u.save();
  res.json({ ok: true });
});

api.get('/stats', auth, async (req, res) => {
  const list = await Product.find({ userId: req.uid }).select('price receipt repairLogs');
  res.json({
    assets: list.length,
    value: list.reduce((n, p) => n + p.price, 0),
    repairs: list.reduce((n, p) => n + p.repairLogs.length, 0),
    bytes: list.reduce((n, p) => n + Buffer.byteLength(p.receipt || ''), 0)
  });
});

const products = express.Router();
api.use('/products', auth, products);

const fields = b => {
  const d = new Date(b.purchaseDate);
  const o = {
    title: b.title, brand: b.brand, category: b.category, serialNumber: b.serialNumber,
    purchaseDate: d, warrantyMonths: Number(b.warrantyMonths), price: Number(b.price), receipt: b.receipt,
    expiryDate: new Date(new Date(d).setMonth(d.getMonth() + Number(b.warrantyMonths)))
  };
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
};
const mine = req => ({ _id: req.params.id, userId: req.uid });

products.get('/', async (req, res) => {
  const { search, category, status } = req.query;
  const q = { userId: req.uid };
  if (category && category !== 'All') q.category = category;
  if (search) {
    const r = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    q.$or = ['title', 'brand', 'serialNumber'].map(k => ({ [k]: r }));
  }
  const now = new Date(), soon = new Date(+now + 30 * 864e5);
  if (status === 'Active') q.expiryDate = { $gt: soon };
  if (status === 'Expiring Soon') q.expiryDate = { $gte: now, $lte: soon };
  if (status === 'Expired') q.expiryDate = { $lt: now };
  res.json(await Product.find(q).select('-receipt').sort({ createdAt: -1 }));
});
products.post('/', async (req, res) => res.status(201).json(await Product.create({ ...fields(req.body), userId: req.uid })));
products.get('/:id', async (req, res) => {
  const p = await Product.findOne(mine(req));
  p ? res.json(p) : bad(res, 'Asset not found', 404);
});
products.put('/:id', async (req, res) => {
  const p = await Product.findOne(mine(req));
  if (!p) return bad(res, 'Asset not found', 404);
  p.set(fields(req.body));
  res.json(await p.save());
});
products.delete('/:id', async (req, res) => {
  (await Product.findOneAndDelete(mine(req))) ? res.json({ ok: true }) : bad(res, 'Asset not found', 404);
});
products.patch('/:id/bookmark', async (req, res) => {
  const p = await Product.findOne(mine(req));
  if (!p) return bad(res, 'Asset not found', 404);
  p.isBookmarked = !p.isBookmarked;
  await p.save();
  res.json({ id: p.id, isBookmarked: p.isBookmarked });
});
products.post('/:id/repairs', async (req, res) => {
  const p = await Product.findOne(mine(req));
  if (!p) return bad(res, 'Asset not found', 404);
  p.repairLogs.push(req.body);
  res.status(201).json(await p.save());
});
products.post('/:id/claim', async (req, res) => {
  if (!(await Product.exists(mine(req)))) return bad(res, 'Asset not found', 404);
  const u = await User.findByIdAndUpdate(req.uid, { $inc: { claimsFiled: 1 } }, { new: true });
  res.json({ claimsFiled: u.claimsFiled });
});

const dist = path.join(__dirname, '../frontend/dist');
app.use(express.static(dist));
app.get('/{*any}', (req, res) => res.sendFile(path.join(dist, 'index.html')));

app.use((e, req, res, next) => {
  const code = e.code === 11000 ? 409 : ['ValidationError', 'CastError'].includes(e.name) ? 400 : 500;
  if (code === 500) console.error(e);
  bad(res, e.code === 11000 ? 'That email is already registered' : code === 500 ? 'Server error' : e.message, code);
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => app.listen(process.env.PORT || 5000, () => console.log('ClaimVault API running')))
  .catch(e => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
