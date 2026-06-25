'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Tab = 'dashboard' | 'drivers' | 'vehicles' | 'ratings';

interface Driver {
  id: number;
  name: string;
  phone: string | null;
  is_active: number;
  vehicle_plate: string | null;
  vehicle_model: string | null;
  avg_stars: number | null;
  total_reviews: number;
}

interface Vehicle {
  id: number;
  plate: string;
  model: string;
  year: number | null;
  driver_id: number | null;
  driver_name: string | null;
}

interface Rating {
  id: number;
  driver_name: string;
  stars: number;
  comment: string | null;
  created_at: string;
}

interface Ranking {
  id: number;
  name: string;
  avg_stars: number;
  total_reviews: number;
}

function Stars({ value }: { value: number | null }) {
  if (value === null) return <span className="text-gray-600 text-sm">No reviews</span>;
  return (
    <span className="flex items-center gap-1">
      <span className="text-yellow-400">{'★'.repeat(Math.round(value))}{'☆'.repeat(5 - Math.round(value))}</span>
      <span className="text-sm text-gray-600 ml-1">{value.toFixed(1)}</span>
    </span>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [rankMonth, setRankMonth] = useState(new Date().toISOString().slice(0, 7));
  const [exportMonth, setExportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showInactive, setShowInactive] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<'all' | 'negative'>('all');
  const [qrModal, setQrModal] = useState<{ id: number; name: string } | null>(null);
  const [driverModal, setDriverModal] = useState<Partial<Driver> | null>(null);
  const [vehicleModal, setVehicleModal] = useState<Partial<Vehicle> | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchDrivers = useCallback(async () => {
    const r = await fetch(`/api/admin/drivers${showInactive ? '?all=1' : ''}`);
    if (r.status === 401) { router.push('/admin'); return; }
    setDrivers(await r.json());
  }, [router, showInactive]);

  const fetchVehicles = useCallback(async () => {
    const r = await fetch('/api/admin/vehicles');
    if (r.status === 401) { router.push('/admin'); return; }
    setVehicles(await r.json());
  }, [router]);

  const fetchRatings = useCallback(async () => {
    const url = ratingFilter === 'negative'
      ? '/api/admin/ratings?maxStars=2'
      : '/api/admin/ratings';
    const r = await fetch(url);
    if (r.status === 401) { router.push('/admin'); return; }
    setRatings(await r.json());
  }, [router, ratingFilter]);

  const fetchRankings = useCallback(async (month: string) => {
    const r = await fetch(`/api/admin/rankings?month=${month}`);
    if (r.status === 401) { router.push('/admin'); return; }
    setRankings((await r.json()).rankings);
  }, [router]);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);
  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);
  useEffect(() => { fetchRatings(); }, [fetchRatings]);
  useEffect(() => { fetchRankings(rankMonth); }, [fetchRankings, rankMonth]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin');
  }

  async function toggleDriverActive(d: Driver) {
    const action = d.is_active ? 'Deactivate' : 'Reactivate';
    if (!confirm(`${action} driver "${d.name}"?`)) return;
    await fetch(`/api/admin/drivers/${d.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: d.name, phone: d.phone, is_active: !d.is_active }),
    });
    fetchDrivers();
  }

  async function saveDriver() {
    if (!driverModal) return;
    setSaving(true);
    const isNew = !driverModal.id;
    const url = isNew ? '/api/admin/drivers' : `/api/admin/drivers/${driverModal.id}`;
    await fetch(url, {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: driverModal.name, phone: driverModal.phone, is_active: driverModal.is_active ?? 1 }),
    });
    setDriverModal(null);
    setSaving(false);
    fetchDrivers();
  }

  async function deleteDriver(id: number) {
    if (!confirm('Permanently delete this driver? All their ratings will also be deleted.')) return;
    await fetch(`/api/admin/drivers/${id}`, { method: 'DELETE' });
    fetchDrivers();
  }

  async function saveVehicle() {
    if (!vehicleModal) return;
    setSaving(true);
    const isNew = !vehicleModal.id;
    const url = isNew ? '/api/admin/vehicles' : `/api/admin/vehicles/${vehicleModal.id}`;
    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vehicleModal),
    });
    if (!res.ok) {
      const e = await res.json();
      alert(e.error || 'Error saving vehicle');
    } else {
      setVehicleModal(null);
      fetchVehicles();
      fetchDrivers();
    }
    setSaving(false);
  }

  async function deleteVehicle(id: number) {
    if (!confirm('Delete this vehicle?')) return;
    await fetch(`/api/admin/vehicles/${id}`, { method: 'DELETE' });
    fetchVehicles();
    fetchDrivers();
  }

  function exportReport(format: 'excel' | 'pdf') {
    window.open(`/api/admin/export?month=${exportMonth}&format=${format}`, '_blank');
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'drivers', label: 'Drivers', icon: '👤' },
    { id: 'vehicles', label: 'Vehicles', icon: '🚗' },
    { id: 'ratings', label: 'Feedback', icon: '⭐' },
  ];

  const activeDrivers = drivers.filter(d => d.is_active);
  const negativeRatings = ratings.filter(r => r.stars <= 2);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚗</span>
          <div>
            <h1 className="font-bold text-gray-800">VU Reviews Admin</h1>
            <p className="text-xs text-gray-500">{activeDrivers.length} active drivers · {vehicles.length} vehicles</p>
          </div>
        </div>
        <button onClick={logout} className="text-sm text-gray-500 hover:text-red-500 transition-colors">
          Log out
        </button>
      </header>

      <nav className="bg-white border-b border-gray-200 px-6 flex gap-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors relative ${
              tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.icon} {t.label}
            {t.id === 'ratings' && negativeRatings.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
        ))}
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-6">

        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm">Active Drivers</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{activeDrivers.length}</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm">Total Reviews</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{ratings.length}</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm">Avg Rating</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {ratings.length ? (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length).toFixed(1) : '—'}
                </p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-red-100">
                <p className="text-red-500 text-sm">Negative (1–2★)</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{negativeRatings.length}</p>
              </div>
            </div>

            {/* Rankings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">Monthly Rankings</h2>
                <input
                  type="month"
                  value={rankMonth}
                  onChange={e => setRankMonth(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              {rankings.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No reviews this month.</p>
              ) : (
                <div className="space-y-2">
                  {rankings.map((r, i) => (
                    <div key={r.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        i === 0 ? 'bg-yellow-100 text-yellow-700' :
                        i === 1 ? 'bg-gray-100 text-gray-600' :
                        i === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-50 text-gray-500'
                      }`}>{i + 1}</span>
                      <div className="flex-1">
                        <Link href={`/admin/drivers/${r.id}`} className="font-medium text-gray-800 hover:text-blue-600 transition-colors">
                          {r.name}
                        </Link>
                        <p className="text-xs text-gray-500">{r.total_reviews} reviews</p>
                      </div>
                      <Stars value={r.avg_stars} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Export */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-4">Export Monthly Report</h2>
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Month</label>
                  <input
                    type="month"
                    value={exportMonth}
                    onChange={e => setExportMonth(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => exportReport('excel')}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                  >
                    <span>📊</span> Export Excel
                  </button>
                  <button
                    onClick={() => exportReport('pdf')}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                  >
                    <span>📄</span> Export PDF
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">Includes driver rankings, all feedback, and negative feedback sheet.</p>
            </div>
          </div>
        )}

        {/* DRIVERS */}
        {tab === 'drivers' && (
          <div>
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-gray-800 text-lg">Drivers</h2>
                <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={e => setShowInactive(e.target.checked)}
                    className="rounded"
                  />
                  Show inactive
                </label>
              </div>
              <button
                onClick={() => setDriverModal({ name: '', phone: '', is_active: 1 })}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              >
                + Add Driver
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {drivers.length === 0 ? (
                <p className="text-center text-gray-500 py-12">No drivers. Add one to get started.</p>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Vehicle</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Rating</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Reviews</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {drivers.map(d => (
                      <tr key={d.id} className={`hover:bg-gray-50 ${!d.is_active ? 'opacity-60' : ''}`}>
                        <td className="px-5 py-3">
                          <Link href={`/admin/drivers/${d.id}`} className="font-medium text-gray-800 hover:text-blue-600 transition-colors">
                            {d.name}
                          </Link>
                          {d.phone && <p className="text-xs text-gray-600 mt-0.5">{d.phone}</p>}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600">
                          {d.vehicle_plate
                            ? <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{d.vehicle_plate}</span>
                            : <span className="text-gray-500">—</span>}
                        </td>
                        <td className="px-5 py-3"><Stars value={d.avg_stars} /></td>
                        <td className="px-5 py-3 text-sm text-gray-500">{d.total_reviews}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            d.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {d.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => setQrModal({ id: d.id, name: d.name })}
                              className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded-lg transition-colors"
                            >
                              QR
                            </button>
                            <button
                              onClick={() => setDriverModal({ ...d })}
                              className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded-lg transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => toggleDriverActive(d)}
                              className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                                d.is_active
                                  ? 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700'
                                  : 'bg-green-50 hover:bg-green-100 text-green-700'
                              }`}
                            >
                              {d.is_active ? 'Deactivate' : 'Reactivate'}
                            </button>
                            <button
                              onClick={() => deleteDriver(d.id)}
                              className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded-lg transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* VEHICLES */}
        {tab === 'vehicles' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-800 text-lg">Vehicles ({vehicles.length})</h2>
              <button
                onClick={() => setVehicleModal({ plate: '', model: '' })}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              >
                + Add Vehicle
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {vehicles.length === 0 ? (
                <p className="text-center text-gray-500 py-12">No vehicles yet.</p>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Plate</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Model</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Year</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Driver</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {vehicles.map(v => (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <span className="font-mono font-semibold bg-gray-100 px-2 py-0.5 rounded text-sm">{v.plate}</span>
                        </td>
                        <td className="px-5 py-3 text-gray-700">{v.model}</td>
                        <td className="px-5 py-3 text-gray-500">{v.year || '—'}</td>
                        <td className="px-5 py-3 text-gray-600">{v.driver_name || <span className="text-gray-500">Unassigned</span>}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <button onClick={() => setVehicleModal(v)} className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded-lg transition-colors">Edit</button>
                            <button onClick={() => deleteVehicle(v.id)} className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded-lg transition-colors">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* FEEDBACK */}
        {tab === 'ratings' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800 text-lg">Feedback</h2>
              <div className="flex gap-2">
                {(['all', 'negative'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setRatingFilter(f)}
                    className={`text-sm px-3 py-1.5 rounded-lg capitalize transition-colors ${
                      ratingFilter === f
                        ? f === 'negative' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f === 'negative' ? '⚠ Negative only' : 'All'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {ratings.length === 0 ? (
                <p className="text-center text-gray-500 py-12">No feedback yet.</p>
              ) : (
                ratings.map(r => (
                  <div key={r.id} className={`bg-white rounded-xl shadow-sm border p-4 ${r.stars <= 2 ? 'border-red-100' : 'border-gray-100'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <Link href={`/admin/drivers/${drivers.find(d => d.name === r.driver_name)?.id}`} className="font-medium text-gray-800 hover:text-blue-600 transition-colors">
                          {r.driver_name}
                        </Link>
                        <div className="flex items-center gap-1 mt-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span key={i} className={i < r.stars ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                          ))}
                          {r.stars <= 2 && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full ml-1">Negative</span>}
                        </div>
                        {r.comment && <p className="text-gray-600 text-sm mt-2">{r.comment}</p>}
                      </div>
                      <p className="text-xs text-gray-600 whitespace-nowrap ml-4">
                        {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setQrModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-800 text-center mb-1">QR Code</h3>
            <p className="text-sm text-gray-500 text-center mb-4">{qrModal.name}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/admin/qr/${qrModal.id}`} alt={`QR for ${qrModal.name}`} className="w-full rounded-xl border border-gray-100" />
            <p className="text-xs text-gray-500 text-center mt-3">Right-click → Save to download</p>
            <div className="flex gap-2 mt-4">
              <Link
                href={`/admin/drivers/${qrModal.id}`}
                className="flex-1 text-center bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 rounded-xl transition-colors text-sm"
              >
                View Profile
              </Link>
              <button onClick={() => setQrModal(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-xl transition-colors text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Modal */}
      {driverModal !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-800 mb-4">{driverModal.id ? 'Edit Driver' : 'Add Driver'}</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Full name *"
                value={driverModal.name || ''}
                onChange={e => setDriverModal({ ...driverModal, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <input
                type="text"
                placeholder="Phone (optional)"
                value={driverModal.phone || ''}
                onChange={e => setDriverModal({ ...driverModal, phone: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setDriverModal(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={saveDriver} disabled={saving || !driverModal.name?.trim()} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2.5 rounded-xl text-sm">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Modal */}
      {vehicleModal !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-800 mb-4">{vehicleModal.id ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Plate number *"
                value={vehicleModal.plate || ''}
                onChange={e => setVehicleModal({ ...vehicleModal, plate: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <input
                type="text"
                placeholder="Model (e.g. Toyota Innova) *"
                value={vehicleModal.model || ''}
                onChange={e => setVehicleModal({ ...vehicleModal, model: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <input
                type="number"
                placeholder="Year (optional)"
                value={vehicleModal.year || ''}
                onChange={e => setVehicleModal({ ...vehicleModal, year: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <select
                value={vehicleModal.driver_id || ''}
                onChange={e => setVehicleModal({ ...vehicleModal, driver_id: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              >
                <option value="">— No driver assigned —</option>
                {drivers.filter(d => d.is_active).map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setVehicleModal(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={saveVehicle} disabled={saving || !vehicleModal.plate?.trim() || !vehicleModal.model?.trim()} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2.5 rounded-xl text-sm">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
