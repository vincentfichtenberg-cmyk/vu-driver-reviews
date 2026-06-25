'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Lang = 'en' | 'vi';

const T = {
  en: {
    title: 'VU Reviews',
    subtitle: 'Admin Panel',
    placeholder: 'Admin password',
    login: 'Log In',
    loggingIn: 'Logging in...',
    error: 'Incorrect password.',
  },
  vi: {
    title: 'VU Reviews',
    subtitle: 'Quản trị viên',
    placeholder: 'Mật khẩu quản trị',
    login: 'Đăng nhập',
    loggingIn: 'Đang đăng nhập...',
    error: 'Mật khẩu không đúng.',
  },
};

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<Lang>('vi');
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('vu-lang') as Lang | null;
    if (saved === 'en' || saved === 'vi') setLang(saved);
  }, []);

  function switchLang(l: Lang) {
    setLang(l);
    localStorage.setItem('vu-lang', l);
  }

  const t = T[lang];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push('/admin/dashboard');
    } else {
      setError(t.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="flex justify-end mb-2">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 text-xs font-medium">
            <button onClick={() => switchLang('vi')} className={`px-2.5 py-1 rounded-md transition-colors ${lang === 'vi' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>🇻🇳 VI</button>
            <button onClick={() => switchLang('en')} className={`px-2.5 py-1 rounded-md transition-colors ${lang === 'en' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>🇬🇧 EN</button>
          </div>
        </div>
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🚗</div>
          <h1 className="text-2xl font-bold text-gray-800">{t.title}</h1>
          <p className="text-gray-500 text-sm mt-1">{t.subtitle}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={t.placeholder}
            autoFocus
            className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? t.loggingIn : t.login}
          </button>
        </form>
      </div>
    </div>
  );
}
