'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface DriverProfile {
  id: number;
  name: string;
  phone: string | null;
  is_active: number;
  created_at: string;
  vehicle_plate: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  avg_stars: number | null;
  total_reviews: number;
  recent_ratings: { id: number; stars: number; comment: string | null; created_at: string }[];
}

function Stars({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-base';
  return (
    <span className={cls}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < value ? 'text-yellow-400' : 'text-gray-200'}>★</span>
      ))}
    </span>
  );
}

export default function DriverProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });

  const fetchDriver = useCallback(async () => {
    const r = await fetch(`/api/admin/drivers/${id}`);
    if (r.status === 401) { router.push('/admin'); return; }
    if (!r.ok) { setNotFound(true); return; }
    const data = await r.json();
    setDriver(data);
    setEditForm({ name: data.name, phone: data.phone || '' });
  }, [id, router]);

  useEffect(() => { fetchDriver(); }, [fetchDriver]);

  async function toggleActive() {
    if (!driver) return;
    const action = driver.is_active ? 'deactivate' : 'reactivate';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this driver?`)) return;
    await fetch(`/api/admin/drivers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: driver.name, phone: driver.phone, is_active: !driver.is_active }),
    });
    fetchDriver();
  }

  async function saveEdit() {
    if (!editForm.name.trim()) return;
    await fetch(`/api/admin/drivers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editForm.name, phone: editForm.phone, is_active: driver?.is_active }),
    });
    setEditing(false);
    fetchDriver();
  }

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">Driver not found.</p>
        <Link href="/admin/dashboard" className="text-blue-600 hover:underline">← Back to dashboard</Link>
      </div>
    </div>
  );

  if (!driver) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );

  const filtered = driver.recent_ratings.filter(r =>
    filter === 'positive' ? r.stars >= 4 :
    filter === 'negative' ? r.stars <= 2 : true
  );

  const negativeCount = driver.recent_ratings.filter(r => r.stars <= 2).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <Link href="/admin/dashboard" className="text-gray-400 hover:text-gray-700 transition-colors">
          ← Back
        </Link>
        <h1 className="font-bold text-gray-800">Driver Profile</h1>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-6 space-y-5">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold ${
                driver.is_active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'
              }`}>
                {driver.name.charAt(0).toUpperCase()}
              </div>
              <div>
                {editing ? (
                  <div className="space-y-2">
                    <input
                      value={editForm.name}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-semibold w-52 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <input
                      value={editForm.phone}
                      onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="Phone"
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">Save</button>
                      <button onClick={() => setEditing(false)} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-gray-800">{driver.name}</h2>
                      {!driver.is_active && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Inactive</span>
                      )}
                    </div>
                    {driver.phone && <p className="text-gray-500 text-sm mt-0.5">{driver.phone}</p>}
                    <p className="text-gray-400 text-xs mt-1">Added {new Date(driver.created_at).toLocaleDateString()}</p>
                  </>
                )}
              </div>
            </div>
            {!editing && (
              <div className="flex gap-2">
                <button onClick={() => setEditing(true)} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors">
                  Edit
                </button>
                <button
                  onClick={toggleActive}
                  className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    driver.is_active
                      ? 'bg-red-50 hover:bg-red-100 text-red-600'
                      : 'bg-green-50 hover:bg-green-100 text-green-700'
                  }`}
                >
                  {driver.is_active ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 mb-1">Vehicle Plate</p>
              {driver.vehicle_plate
                ? <span className="font-mono font-semibold bg-gray-100 px-2 py-1 rounded text-sm">{driver.vehicle_plate}</span>
                : <span className="text-gray-400 text-sm">—</span>}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Vehicle Model</p>
              <p className="font-medium text-gray-800 text-sm">{driver.vehicle_model || '—'}</p>
              {driver.vehicle_year && <p className="text-xs text-gray-400">{driver.vehicle_year}</p>}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Avg Rating</p>
              {driver.avg_stars !== null
                ? <div className="flex items-center gap-1"><Stars value={Math.round(driver.avg_stars)} size="sm" /><span className="text-sm font-semibold">{driver.avg_stars.toFixed(1)}</span></div>
                : <span className="text-gray-400 text-sm">No reviews</span>}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-800">{driver.total_reviews}</p>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">QR Code</h3>
              <p className="text-sm text-gray-500 mt-0.5">Customers scan this to rate {driver.name}</p>
            </div>
            <button
              onClick={() => setQrVisible(!qrVisible)}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              {qrVisible ? 'Hide QR' : 'Show QR'}
            </button>
          </div>
          {qrVisible && (
            <div className="mt-4 flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/admin/qr/${id}`} alt="QR code" className="w-56 h-56 rounded-xl border border-gray-100" />
              <p className="text-xs text-gray-400 mt-2">Right-click → Save image to download</p>
            </div>
          )}
        </div>

        {/* Feedback */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-800">Feedback</h3>
              {negativeCount > 0 && (
                <p className="text-xs text-red-500 mt-0.5">{negativeCount} negative review{negativeCount > 1 ? 's' : ''}</p>
              )}
            </div>
            <div className="flex gap-1">
              {(['all', 'positive', 'negative'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors capitalize ${
                    filter === f
                      ? f === 'negative' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No {filter !== 'all' ? filter : ''} reviews.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map(r => (
                <div key={r.id} className={`rounded-xl p-4 border ${
                  r.stars <= 2 ? 'border-red-100 bg-red-50' : 'border-gray-100 bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <Stars value={r.stars} size="sm" />
                    <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  {r.comment && <p className="text-gray-700 text-sm mt-2">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
