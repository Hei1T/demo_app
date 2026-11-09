import { useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { api, getToken } from './lib/api';
import Login from './pages/Login';
import Layout from './pages/Layout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Cards from './pages/Cards';
import Templates from './pages/Templates';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import UserDetail from './pages/UserDetail';
import CardDetail from './pages/CardDetail';
import Links from './pages/Links';

function Guard({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'checking' | 'ok' | 'deny'>('checking');
  const loc = useLocation();

  useEffect(() => {
    const t = getToken();
    if (!t) {
      setState('deny');
      return;
    }
    api
      .me()
      .then((u) => setState(u.role === 'admin' ? 'ok' : 'deny'))
      .catch(() => setState('deny'));
  }, [loc.pathname]);

  if (state === 'checking')
    return <p className="p-10 text-sm text-muted-foreground">校验权限中…</p>;
  if (state === 'deny') return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <Guard>
              <Layout />
            </Guard>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />`r`n          <Route path="/users/:id" element={<UserDetail />} />
          <Route path="/cards" element={<Cards />} />`r`n          <Route path="/cards/:code" element={<CardDetail />} />`r`n          <Route path="/links" element={<Links />} />`r`n          <Route path="/templates" element={<Templates />} />`r`n          <Route path="/analytics" element={<Analytics />} />`r`n          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
