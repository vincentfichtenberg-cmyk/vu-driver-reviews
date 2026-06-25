'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Tab = 'dashboard' | 'drivers' | 'ratings';
type Lang = 'en' | 'vi';

interface Driver {
  id: number;
  name: string;
  phone: string | null;
  is_active: number;
  vehicle_id: number | null;
  vehicle_plate: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  avg_stars: number | null;
  total_reviews: number;
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

interface Alert {
  id: number;
  driver_id: number;
  driver_name: string;
  stars: number;
  comment: string | null;
  is_read: number;
  created_at: string;
}

const T = {
  en: {
    appName: 'VU Reviews Admin',
    activeDrivers: 'active drivers',
    logout: 'Log out',
    alerts: 'Alerts',
    markAllRead: 'Mark all read',
    noAlerts: 'No alerts',
    tabs: { dashboard: 'Dashboard', drivers: 'Drivers', ratings: 'Feedback' },
    statActiveDrivers: 'Active Drivers',
    statTotalReviews: 'Total Reviews',
    statAvgRating: 'Avg Rating',
    statNegative: 'Negative (1–2★)',
    rankingsTitle: '🏆 Top 10 Drivers of the Month',
    rankingsSubtitle: 'Ranked by average star rating',
    noRankings: 'No reviews recorded this month yet.',
    review: 'review', reviews: 'reviews',
    exportTitle: 'Export Monthly Report',
    exportMonth: 'Month',
    exportExcel: 'Export Excel',
    exportPdf: 'Export PDF',
    exportHint: 'Includes driver rankings, all feedback, and negative feedback sheet.',
    driversTitle: 'Drivers',
    showInactive: 'Show inactive',
    importBtn: 'Import VUHQ List',
    addDriver: '+ Add Driver',
    noDrivers: 'No drivers. Add one to get started.',
    colName: 'Name',
    colPlate: 'Plate',
    colVehicle: 'Vehicle',
    colRating: 'Rating',
    colReviews: 'Reviews',
    colStatus: 'Status',
    statusActive: 'Active',
    statusInactive: 'Inactive',
    noReviews: 'No reviews',
    btnEdit: 'Edit', btnDeactivate: 'Deactivate', btnReactivate: 'Reactivate', btnDelete: 'Delete',
    feedbackTitle: 'Feedback',
    filterAll: 'All', filterNegative: '⚠ Negative only',
    noFeedback: 'No feedback yet.',
    negative: 'Negative',
    qrTitle: 'QR Code',
    qrHint: 'Right-click → Save to download',
    viewProfile: 'View Profile',
    close: 'Close',
    addDriverTitle: 'Add Driver', editDriverTitle: 'Edit Driver',
    sectionDriver: 'Driver Info',
    sectionVehicle: 'Vehicle Info',
    namePlaceholder: 'Full name *',
    phonePlaceholder: 'Phone (optional)',
    platePlaceholder: 'License plate (optional)',
    modelPlaceholder: 'Vehicle model (e.g. Toyota Innova)',
    yearPlaceholder: 'Year (optional)',
    cancel: 'Cancel', save: 'Save', saving: 'Saving...',
    confirmDeactivate: (name: string) => `Deactivate driver "${name}"?`,
    confirmReactivate: (name: string) => `Reactivate driver "${name}"?`,
    confirmDeleteDriver: 'Permanently delete this driver? All their ratings will also be deleted.',
    confirmSeed: 'Import the 13 VUHQ drivers from the list? This will skip any already added.',
    seedResult: (added: number, skipped: number) => `Added: ${added} drivers.\nSkipped (already exist): ${skipped}`,
    errorSavingVehicle: 'Error saving',
  },
  vi: {
    appName: 'Quản Trị VU Reviews',
    activeDrivers: 'tài xế đang hoạt động',
    logout: 'Đăng xuất',
    alerts: 'Thông báo',
    markAllRead: 'Đánh dấu tất cả đã đọc',
    noAlerts: 'Không có thông báo',
    tabs: { dashboard: 'Tổng quan', drivers: 'Tài xế', ratings: 'Phản hồi' },
    statActiveDrivers: 'Tài xế hoạt động',
    statTotalReviews: 'Tổng đánh giá',
    statAvgRating: 'Điểm trung bình',
    statNegative: 'Tiêu cực (1–2★)',
    rankingsTitle: '🏆 Top 10 Tài Xế Tháng Này',
    rankingsSubtitle: 'Xếp hạng theo điểm đánh giá trung bình',
    noRankings: 'Chưa có đánh giá nào trong tháng này.',
    review: 'đánh giá', reviews: 'đánh giá',
    exportTitle: 'Xuất Báo Cáo Tháng',
    exportMonth: 'Tháng',
    exportExcel: 'Xuất Excel',
    exportPdf: 'Xuất PDF',
    exportHint: 'Bao gồm xếp hạng tài xế, tất cả phản hồi và trang phản hồi tiêu cực.',
    driversTitle: 'Tài xế',
    showInactive: 'Hiển thị không hoạt động',
    importBtn: 'Nhập danh sách VUHQ',
    addDriver: '+ Thêm tài xế',
    noDrivers: 'Chưa có tài xế. Thêm tài xế để bắt đầu.',
    colName: 'Tên',
    colPlate: 'Biển số',
    colVehicle: 'Xe',
    colRating: 'Điểm',
    colReviews: 'Đánh giá',
    colStatus: 'Trạng thái',
    statusActive: 'Hoạt động',
    statusInactive: 'Ngưng hoạt động',
    noReviews: 'Chưa có đánh giá',
    btnEdit: 'Sửa', btnDeactivate: 'Tạm ngưng', btnReactivate: 'Kích hoạt lại', btnDelete: 'Xóa',
    feedbackTitle: 'Phản hồi',
    filterAll: 'Tất cả', filterNegative: '⚠ Tiêu cực',
    noFeedback: 'Chưa có phản hồi.',
    negative: 'Tiêu cực',
    qrTitle: 'Mã QR',
    qrHint: 'Nhấp chuột phải → Lưu để tải về',
    viewProfile: 'Xem hồ sơ',
    close: 'Đóng',
    addDriverTitle: 'Thêm tài xế', editDriverTitle: 'Sửa tài xế',
    sectionDriver: 'Thông tin tài xế',
    sectionVehicle: 'Thông tin xe',
    namePlaceholder: 'Họ và tên *',
    phonePlaceholder: 'Số điện thoại (tùy chọn)',
    platePlaceholder: 'Biển số xe (tùy chọn)',
    modelPlaceholder: 'Dòng xe (vd. Toyota Innova)',
    yearPlaceholder: 'Năm (tùy chọn)',
    cancel: 'Hủy', save: 'Lưu', saving: 'Đang lưu...',
    confirmDeactivate: (name: string) => `Tạm ngưng tài xế "${name}"?`,
    confirmReactivate: (name: string) => `Kích hoạt lại tài xế "${name}"?`,
    confirmDeleteDriver: 'Xóa vĩnh viễn tài xế này? Tất cả đánh giá của họ cũng sẽ bị xóa.',
    confirmSeed: 'Nhập 13 tài xế VUHQ từ danh sách? Những tài xế đã tồn tại sẽ được bỏ qua.',
    seedResult: (added: number, skipped: number) => `Đã thêm: ${added} tài xế.\nBỏ qua (đã tồn tại): ${skipped}`,
    errorSavingVehicle: 'Lỗi khi lưu',
  },
};

const MEDAL = ['🥇', '🥈', '🥉'];

function Stars({ value, noReviews }: { value: number | null; noReviews: string }) {
  if (value === null) return <span className="text-gray-600 text-sm">{noReviews}</span>;
  return (
    <span className="flex items-center gap-1">
      <span className="text-yellow-400">{'★'.repeat(Math.round(value))}{'☆'.repeat(5 - Math.round(value))}</span>
      <span className="text-sm text-gray-600 ml-1">{value.toFixed(1)}</span>
    </span>
  );
}

function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1 text-xs font-medium">
      <button onClick={() => onChange('vi')} className={`px-2.5 py-1 rounded-md transition-colors ${lang === 'vi' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>🇻🇳 VI</button>
      <button onClick={() => onChange('en')} className={`px-2.5 py-1 rounded-md transition-colors ${lang === 'en' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>🇬🇧 EN</button>
    </div>
  );
}

type DriverModal = Partial<Driver> & { vehicle_model?: string | null; vehicle_year?: number | null };

export default function Dashboard() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('vi');
  const [tab, setTab] = useState<Tab>('dashboard');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [rankMonth, setRankMonth] = useState(new Date().toISOString().slice(0, 7));
  const [exportMonth, setExportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showInactive, setShowInactive] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<'all' | 'negative'>('all');
  const [qrModal, setQrModal] = useState<{ id: number; name: string } | null>(null);
  const [driverModal, setDriverModal] = useState<DriverModal | null>(null);
  const [saving, setSaving] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const alertsRef = useRef<HTMLDivElement>(null);

  const t = T[lang];

  useEffect(() => {
    const saved = localStorage.getItem('vu-lang') as Lang | null;
    if (saved === 'en' || saved === 'vi') setLang(saved);
  }, []);

  function switchLang(l: Lang) { setLang(l); localStorage.setItem('vu-lang', l); }

  const fetchDrivers = useCallback(async () => {
    const r = await fetch(`/api/admin/drivers${showInactive ? '?all=1' : ''}`);
    if (r.status === 401) { router.push('/admin'); return; }
    setDrivers(await r.json());
  }, [router, showInactive]);

  const fetchRatings = useCallback(async () => {
    const url = ratingFilter === 'negative' ? '/api/admin/ratings?maxStars=2' : '/api/admin/ratings';
    const r = await fetch(url);
    if (r.status === 401) { router.push('/admin'); return; }
    setRatings(await r.json());
  }, [router, ratingFilter]);

  const fetchRankings = useCallback(async (month: string) => {
    const r = await fetch(`/api/admin/rankings?month=${month}`);
    if (r.status === 401) { router.push('/admin'); return; }
    setRankings((await r.json()).rankings);
  }, [router]);

  const fetchAlerts = useCallback(async () => {
    const r = await fetch('/api/admin/alerts');
    if (r.ok) setAlerts(await r.json());
  }, []);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);
  useEffect(() => { fetchRatings(); }, [fetchRatings]);
  useEffect(() => { fetchRankings(rankMonth); }, [fetchRankings, rankMonth]);
  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) setAlertsOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/admin'); }

  async function markAlertRead(id: number) {
    await fetch('/api/admin/alerts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchAlerts();
  }
  async function markAllAlertsRead() {
    await fetch('/api/admin/alerts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) });
    fetchAlerts();
  }

  async function toggleDriverActive(d: Driver) {
    const msg = d.is_active ? t.confirmDeactivate(d.name) : t.confirmReactivate(d.name);
    if (!confirm(msg)) return;
    await fetch(`/api/admin/drivers/${d.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: d.name, phone: d.phone, is_active: !d.is_active, plate: d.vehicle_plate, model: d.vehicle_model, year: d.vehicle_year }),
    });
    fetchDrivers();
  }

  async function saveDriver() {
    if (!driverModal) return;
    setSaving(true);
    const isNew = !driverModal.id;
    await fetch(isNew ? '/api/admin/drivers' : `/api/admin/drivers/${driverModal.id}`, {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: driverModal.name,
        phone: driverModal.phone,
        is_active: driverModal.is_active ?? 1,
        plate: driverModal.vehicle_plate,
        model: driverModal.vehicle_model,
        year: driverModal.vehicle_year,
      }),
    });
    setDriverModal(null);
    setSaving(false);
    fetchDrivers();
  }

  async function deleteDriver(id: number) {
    if (!confirm(t.confirmDeleteDriver)) return;
    await fetch(`/api/admin/drivers/${id}`, { method: 'DELETE' });
    fetchDrivers();
  }

  async function seedDrivers() {
    if (!confirm(t.confirmSeed)) return;
    const res = await fetch('/api/admin/seed', { method: 'POST' });
    const data = await res.json();
    alert(t.seedResult(data.added?.length ?? 0, data.skipped?.length ?? 0));
    fetchDrivers();
  }

  function exportReport(format: 'excel' | 'pdf') {
    window.open(`/api/admin/export?month=${exportMonth}&format=${format}`, '_blank');
  }

  const tabs: { id: Tab; icon: string }[] = [
    { id: 'dashboard', icon: '📊' },
    { id: 'drivers', icon: '👤' },
    { id: 'ratings', icon: '⭐' },
  ];

  const activeDrivers = drivers.filter(d => d.is_active);
  const negativeRatings = ratings.filter(r => r.stars <= 2);
  const unreadAlerts = alerts.filter(a => !a.is_read);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚗</span>
          <div>
            <h1 className="font-bold text-gray-800">{t.appName}</h1>
            <p className="text-xs text-gray-500">{activeDrivers.length} {t.activeDrivers}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LangToggle lang={lang} onChange={switchLang} />

          <div className="relative" ref={alertsRef}>
            <button onClick={() => setAlertsOpen(!alertsOpen)} className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="text-xl">🔔</span>
              {unreadAlerts.length > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                  {unreadAlerts.length > 9 ? '9+' : unreadAlerts.length}
                </span>
              )}
            </button>
            {alertsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800">{t.alerts}</h3>
                  {unreadAlerts.length > 0 && (
                    <button onClick={markAllAlertsRead} className="text-xs text-blue-600 hover:text-blue-800">{t.markAllRead}</button>
                  )}
                </div>
                {alerts.length === 0 ? (
                  <p className="text-center text-gray-500 py-6 text-sm">{t.noAlerts}</p>
                ) : (
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {alerts.map(a => (
                      <div key={a.id} className={`px-4 py-3 flex gap-3 ${!a.is_read ? 'bg-red-50' : ''}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-red-500 font-bold text-xs">{'★'.repeat(a.stars)} {a.stars}★</span>
                            {!a.is_read && <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />}
                          </div>
                          <Link href={`/admin/drivers/${a.driver_id}`} onClick={() => { markAlertRead(a.id); setAlertsOpen(false); }} className="font-medium text-gray-800 hover:text-blue-600 text-sm">
                            {a.driver_name}
                          </Link>
                          {a.comment && <p className="text-xs text-gray-600 mt-0.5 truncate">{a.comment}</p>}
                          <p className="text-xs text-gray-500 mt-0.5">{new Date(a.created_at).toLocaleString()}</p>
                        </div>
                        {!a.is_read && <button onClick={() => markAlertRead(a.id)} className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0 self-start mt-0.5">✕</button>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button onClick={logout} className="text-sm text-gray-500 hover:text-red-500 transition-colors">{t.logout}</button>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200 px-6 flex gap-1">
        {tabs.map(tab_ => (
          <button
            key={tab_.id}
            onClick={() => setTab(tab_.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors relative ${tab === tab_.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            {tab_.icon} {t.tabs[tab_.id]}
            {tab_.id === 'ratings' && negativeRatings.length > 0 && (
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
                <p className="text-gray-500 text-sm">{t.statActiveDrivers}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{activeDrivers.length}</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm">{t.statTotalReviews}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{ratings.length}</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm">{t.statAvgRating}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {ratings.length ? (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length).toFixed(1) : '—'}
                </p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-red-100">
                <p className="text-red-500 text-sm">{t.statNegative}</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{negativeRatings.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-gray-800 text-lg">{t.rankingsTitle}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{t.rankingsSubtitle}</p>
                </div>
                <input type="month" value={rankMonth} onChange={e => setRankMonth(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              {rankings.length === 0 ? (
                <p className="text-gray-500 text-center py-10">{t.noRankings}</p>
              ) : (
                <div className="space-y-2">
                  {rankings.map((r, i) => (
                    <Link key={r.id} href={`/admin/drivers/${r.id}`} className={`flex items-center gap-4 p-3 rounded-xl transition-colors hover:bg-gray-50 ${i === 0 ? 'bg-yellow-50 border border-yellow-100' : i === 1 ? 'bg-gray-50 border border-gray-100' : i === 2 ? 'bg-orange-50 border border-orange-100' : 'border border-transparent'}`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${i === 0 ? 'bg-yellow-200 text-yellow-800' : i === 1 ? 'bg-gray-200 text-gray-700' : i === 2 ? 'bg-orange-200 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                        {i < 3 ? MEDAL[i] : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{r.name}</p>
                        <p className="text-xs text-gray-500">{r.total_reviews} {r.total_reviews === 1 ? t.review : t.reviews}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-yellow-400 text-sm">{'★'.repeat(Math.round(r.avg_stars))}{'☆'.repeat(5 - Math.round(r.avg_stars))}</span>
                        <span className="font-bold text-gray-700 text-sm ml-1">{Number(r.avg_stars).toFixed(1)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-4">{t.exportTitle}</h2>
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">{t.exportMonth}</label>
                  <input type="month" value={exportMonth} onChange={e => setExportMonth(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => exportReport('excel')} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"><span>📊</span> {t.exportExcel}</button>
                  <button onClick={() => exportReport('pdf')} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"><span>📄</span> {t.exportPdf}</button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">{t.exportHint}</p>
            </div>
          </div>
        )}

        {/* DRIVERS */}
        {tab === 'drivers' && (
          <div>
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-gray-800 text-lg">{t.driversTitle}</h2>
                <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer select-none">
                  <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="rounded" />
                  {t.showInactive}
                </label>
              </div>
              <div className="flex gap-2">
                <button onClick={seedDrivers} className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl transition-colors">{t.importBtn}</button>
                <button onClick={() => setDriverModal({ name: '', phone: '', is_active: 1, vehicle_plate: '', vehicle_model: '', vehicle_year: undefined })} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">{t.addDriver}</button>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {drivers.length === 0 ? (
                <p className="text-center text-gray-500 py-12">{t.noDrivers}</p>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{t.colName}</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{t.colPlate}</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{t.colVehicle}</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{t.colRating}</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{t.colReviews}</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{t.colStatus}</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {drivers.map(d => (
                      <tr key={d.id} className={`hover:bg-gray-50 ${!d.is_active ? 'opacity-60' : ''}`}>
                        <td className="px-5 py-3">
                          <Link href={`/admin/drivers/${d.id}`} className="font-medium text-gray-800 hover:text-blue-600 transition-colors">{d.name}</Link>
                          {d.phone && <p className="text-xs text-gray-600 mt-0.5">{d.phone}</p>}
                        </td>
                        <td className="px-5 py-3">
                          {d.vehicle_plate
                            ? <span className="font-mono font-semibold bg-gray-100 px-2 py-0.5 rounded text-sm">{d.vehicle_plate}</span>
                            : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-700">
                          {d.vehicle_model || <span className="text-gray-400">—</span>}
                          {d.vehicle_year && <span className="text-xs text-gray-500 ml-1">({d.vehicle_year})</span>}
                        </td>
                        <td className="px-5 py-3"><Stars value={d.avg_stars} noReviews={t.noReviews} /></td>
                        <td className="px-5 py-3 text-sm text-gray-500">{d.total_reviews}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${d.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {d.is_active ? t.statusActive : t.statusInactive}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <button onClick={() => setQrModal({ id: d.id, name: d.name })} className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded-lg transition-colors">QR</button>
                            <button onClick={() => setDriverModal({ ...d })} className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded-lg transition-colors">{t.btnEdit}</button>
                            <button onClick={() => toggleDriverActive(d)} className={`text-xs px-2 py-1 rounded-lg transition-colors ${d.is_active ? 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700' : 'bg-green-50 hover:bg-green-100 text-green-700'}`}>
                              {d.is_active ? t.btnDeactivate : t.btnReactivate}
                            </button>
                            <button onClick={() => deleteDriver(d.id)} className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded-lg transition-colors">{t.btnDelete}</button>
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
              <h2 className="font-semibold text-gray-800 text-lg">{t.feedbackTitle}</h2>
              <div className="flex gap-2">
                {(['all', 'negative'] as const).map(f => (
                  <button key={f} onClick={() => setRatingFilter(f)} className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${ratingFilter === f ? f === 'negative' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {f === 'negative' ? t.filterNegative : t.filterAll}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {ratings.length === 0 ? (
                <p className="text-center text-gray-500 py-12">{t.noFeedback}</p>
              ) : (
                ratings.map(r => (
                  <div key={r.id} className={`bg-white rounded-xl shadow-sm border p-4 ${r.stars <= 2 ? 'border-red-100' : 'border-gray-100'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <Link href={`/admin/drivers/${drivers.find(d => d.name === r.driver_name)?.id}`} className="font-medium text-gray-800 hover:text-blue-600 transition-colors">{r.driver_name}</Link>
                        <div className="flex items-center gap-1 mt-1">
                          {Array.from({ length: 5 }, (_, i) => <span key={i} className={i < r.stars ? 'text-yellow-400' : 'text-gray-300'}>★</span>)}
                          {r.stars <= 2 && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full ml-1">{t.negative}</span>}
                        </div>
                        {r.comment && <p className="text-gray-600 text-sm mt-2">{r.comment}</p>}
                      </div>
                      <p className="text-xs text-gray-600 whitespace-nowrap ml-4">{new Date(r.created_at).toLocaleDateString()}</p>
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
            <h3 className="font-bold text-gray-800 text-center mb-1">{t.qrTitle}</h3>
            <p className="text-sm text-gray-500 text-center mb-4">{qrModal.name}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/admin/qr/${qrModal.id}`} alt={`QR for ${qrModal.name}`} className="w-full rounded-xl border border-gray-100" />
            <p className="text-xs text-gray-500 text-center mt-3">{t.qrHint}</p>
            <div className="flex gap-2 mt-4">
              <Link href={`/admin/drivers/${qrModal.id}`} className="flex-1 text-center bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 rounded-xl transition-colors text-sm">{t.viewProfile}</Link>
              <button onClick={() => setQrModal(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-xl transition-colors text-sm">{t.close}</button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Modal */}
      {driverModal !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-800 mb-4">{driverModal.id ? t.editDriverTitle : t.addDriverTitle}</h3>

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t.sectionDriver}</p>
            <div className="space-y-3 mb-4">
              <input type="text" placeholder={t.namePlaceholder} value={driverModal.name || ''} onChange={e => setDriverModal({ ...driverModal, name: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              <input type="text" placeholder={t.phonePlaceholder} value={driverModal.phone || ''} onChange={e => setDriverModal({ ...driverModal, phone: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t.sectionVehicle}</p>
            <div className="space-y-3">
              <input type="text" placeholder={t.platePlaceholder} value={driverModal.vehicle_plate || ''} onChange={e => setDriverModal({ ...driverModal, vehicle_plate: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-300" />
              <input type="text" placeholder={t.modelPlaceholder} value={driverModal.vehicle_model || ''} onChange={e => setDriverModal({ ...driverModal, vehicle_model: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              <input type="number" placeholder={t.yearPlaceholder} value={driverModal.vehicle_year || ''} onChange={e => setDriverModal({ ...driverModal, vehicle_year: e.target.value ? Number(e.target.value) : undefined })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setDriverModal(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm">{t.cancel}</button>
              <button onClick={saveDriver} disabled={saving || !driverModal.name?.trim()} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2.5 rounded-xl text-sm">
                {saving ? t.saving : t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
