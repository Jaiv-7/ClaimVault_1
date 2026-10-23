import { createContext, useContext, useEffect, useState } from 'react';
import { NavLink, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Boxes, LayoutDashboard, LogOut, Moon, Plus, Sun, User } from 'lucide-react';
import { api } from './api';
import { Logo, Toasts } from './ui.jsx';
import Stars from './Stars.jsx';
import Auth from './Auth.jsx';
import Dashboard from './Dashboard.jsx';
import Vault, { AssetModal } from './Vault.jsx';
import Asset from './Asset.jsx';
import Profile from './Profile.jsx';

const Ctx = createContext();
export const useApp = () => useContext(Ctx);

function Shell() {
  const { user, logout, theme, setTheme, openAdd } = useApp();
  const { pathname } = useLocation();
  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const ThemeIcon = theme === 'dark' ? Sun : Moon;
  return (
    <div className="shell">
      <header className="topbar"><Logo /><button className="icon" onClick={toggle} aria-label="Toggle theme"><ThemeIcon size={20} /></button></header>
      <aside className="side">
        <Logo />
        <nav>
          <NavLink to="/" end><LayoutDashboard size={20} />Dashboard</NavLink>
          <NavLink to="/vault"><Boxes size={20} />My Vault</NavLink>
          <NavLink to="/profile"><User size={20} />Profile</NavLink>
        </nav>
        <div className="side-bottom">
          <button className="btn primary wide" onClick={() => openAdd()}><Plus size={18} />Add Asset</button>
          <div className="chip">
            <span className="avatar sm">{user.name[0].toUpperCase()}</span>
            <div><b>{user.name}</b><small>{user.email}</small></div>
            <button className="icon" onClick={toggle} aria-label="Toggle theme"><ThemeIcon size={18} /></button>
          </div>
          <button className="link" onClick={logout}><LogOut size={18} />Sign out</button>
        </div>
      </aside>
      <main className="main" key={pathname}><Outlet /></main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [rev, setRev] = useState(0);
  const [modal, setModal] = useState(null);
  const [theme, setThemeState] = useState(localStorage.getItem('cv_theme') || 'light');

  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => {
    const wait = new Promise(r => setTimeout(r, 700));
    const me = localStorage.getItem('cv_token') ? api('/auth/me').then(setUser).catch(() => localStorage.removeItem('cv_token')) : null;
    Promise.all([me, wait]).then(() => setReady(true));
  }, []);

  if (!ready) return <div className="splash"><Logo /></div>;

  const value = {
    user, setUser, theme, rev,
    bump: () => setRev(r => r + 1),
    setTheme: t => { localStorage.setItem('cv_theme', t); setThemeState(t); },
    logout: () => { localStorage.removeItem('cv_token'); setUser(null); },
    openAdd: () => setModal(true)
  };

  return (
    <Ctx.Provider value={value}>
      <div className="bg"><Stars /></div>
      {user ? (
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/vault" element={<Vault />} />
            <Route path="/products/:id" element={<Asset />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Routes>
      ) : <Auth onAuth={setUser} />}
      {modal && <AssetModal onClose={() => setModal(null)} />}
      <Toasts />
    </Ctx.Provider>
  );
}
