'use client';

import { useStore } from '@/store/useStore';
import { useEffect, useRef, useState } from 'react';
import LoginPage from '@/components/pos/LoginPage';
import Navbar from '@/components/pos/Navbar';
import LoadingScreen from '@/components/pos/LoadingScreen';

export default function Home() {
  const { token, user, setAuth, setPage } = useStore();
  const initialized = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      fetch('/api/seed', { method: 'POST' });
    } catch {
      // ignore
    }

    const storedToken = localStorage.getItem('pos_token');
    const storedUser = localStorage.getItem('pos_user');

    if (storedToken && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setAuth(storedToken, parsedUser);

      if (parsedUser.role === 'ADMIN') {
        setPage('admin-dashboard');
      } else if (parsedUser.role === 'KASIR') {
        setPage('cashier-dashboard');
      }

      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then(function (res) {
          if (res.ok) return res.json();
          throw new Error('Token invalid');
        })
        .then(function (data) {
          setAuth(storedToken, data.user);
        })
        .catch(function () {
          setAuth(null, null);
          setPage('login');
        })
        .finally(function () { setReady(true); });
    } else {
      setReady(true);
    }
  }, [setAuth, setPage]);

  if (!ready) {
    return <LoadingScreen />;
  }

  if (!token || !user) {
    return <LoginPage />;
  }

  return <Navbar />;
}