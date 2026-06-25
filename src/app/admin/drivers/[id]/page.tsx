'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

type Lang = 'en' | 'vi';

interface DriverProfile {
  id: number;
  name: string;
  phone: string | null;
  is_active: number;
  created_at: string;
  vehicle_id: number | null;
  vehicle_plate: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  avg_stars: number | null;
  total_reviews: number;
  recent_ratings: { id: number; stars: number; comment: string | null; customer_name: string | null; customer_contact: string | null; route_from: string | null; route_to: string | null; created_at: string }[];
}

const T = {
  en: {
    back: '← Back',
    pageTitle: 'Driver Profile',
    notFound: 'Driver not found.',
    backToDashboard: '← Back to dashboard',
    inactive: 'Inactive',
    added: (date: string) => `Added ${date}`,
    vehiclePlate: 'Vehicle Plate',
    vehicleModel: 'Vehicle Model',
    avgRating: 'Avg Rating',
    totalReviews: 'Total Reviews',
    noReviews: 'No reviews',
    qrTitle: 'QR Code',
    qrSubtitle: (name: string) => `Customers scan this to rate ${name}`,
    showQr: 'Show QR',
    hideQr: 'Hide QR',
    qrHint: 'Right-click → Save image to download',
    feedbackTitle: 'Feedback',
    negativeCount: (n: number) => `${n} negative review${n > 1 ? 's' : ''}`,
    filterAll: 'All',
    filterPositive: 'Positive',
    filterNegative: 'Negative',
    noFilteredReviews: (f: string) => `No ${f !== 'all' ? f : ''} reviews.`,
    btnEdit: 'Edit',
    btnDeactivate: 'Deactivate',
    btnReactivate: 'Reactivate',
    btnSave: 'Save',
    btnCancel: 'Cancel',
    phonePlaceholder: 'Phone',
    platePlaceholder: 'License plate',
    confirmDeactivate: 'Deactivate this driver?',
    confirmReactivate: 'Reactivate this driver?',
    anonymous: 'Anonymous',
  },
  vi: {
    back: '← Quay lại',
    pageTitle: 'Hồ Sơ Tài Xế',
    notFound: 'Không tìm thấy tài xế.',
    backToDashboard: '← Về trang quản trị',
    inactive: 'Ngưng hoạt động',
    added: (date: string) => `Đã thêm ${date}`,
    vehiclePlate: 'Biển số xe',
    vehicleModel: 'Dòng xe',
    avgRating: 'Điểm trung bình',
    totalReviews: 'Tổng đánh giá',
    noReviews: 'Chưa có đánh giá',
    qrTitle: 'Mã QR',
    qrSubtitle: (name: string) => `Khách hàng quét mã để đánh giá ${name}`,
    showQr: 'Hiển thị mã QR',
    hideQr: 'Ẩn mã QR',
    qrHint: 'Nhấp chuột phải → Lưu để tải về',
    feedbackTitle: 'Phản hồi',
    negativeCount: (n: number) => `${n} phản hồi tiêu cực`,
    filterAll: 'Tất cả',
    filterPositive: 'Tích cực',
    filterNegative: 'Tiêu cực',
    noFilteredReviews: (f: string) => `Không có đánh giá ${f !== 'all' ? (f === 'positive' ? 'tích cực' : 'tiêu cực') : ''}.`,
    btnEdit: 'Sửa',
    btnDeactivate: 'Tạm ngưng',
    btnReactivate: 'Kích hoạt lại',
    btnSave: 'Lưu',
    btnCancel: 'Hủy',
    phonePlaceholder: 'Số điện thoại',
    platePlaceholder: 'Biển số xe',
    confirmDeactivate: 'Tạm ngưng tài xế này?',
    confirmReactivate: 'Kích hoạt lại tài xế này?',
    anonymous: 'Ẩn danh',
  },
};

function Stars({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-base';
  return (
    <span className={cls}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < value ? 'text-yellow-400' : 'text-gray-300'}>★</span>
      ))}
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

export default function DriverProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('vi');
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', plate: '' });

  const t = T[lang];

  useEffect(() => {
    const saved = localStorage.getItem('vu-lang') as Lang | null;
    if (saved === 'en' || saved === 'vi') setLang(saved);
  }, []);

  function switchLang(l: Lang) {
    setLang(l);
    localStorage.setItem('vu-lang', l);
  }

  const fetchDriver = useCallback(async () => {
    const r = await fetch(`/api/admin/drivers/${id}`);
    if (r.status === 401) { router.push('/admin'); return; }
    if (!r.ok) { setNotFound(true); return; }
    const data = await r.json();
    setDriver(data);
    setEditForm({ name: data.name, phone: data.phone || '', plate: data.vehicle_plate || '' });
  }, [id, router]);

  useEffect(() => { fetchDriver(); }, [fetchDriver]);

  async function toggleActive() {
    if (!driver) return;
    const msg = driver.is_active ? t.confirmDeactivate : t.confirmReactivate;
    if (!confirm(msg)) return;
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
      body: JSON.stringify({ name: editForm.name, phone: editForm.phone, plate: editForm.plate, is_active: driver?.is_active }),
    });
    setEditing(false);
    fetchDriver();
  }

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">{t.notFound}</p>
        <Link href="/admin/dashboard" className="text-blue-600 hover:underline">{t.backToDashboard}</Link>
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
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="text-gray-600 hover:text-gray-800 transition-colors">{t.back}</Link>
          <h1 className="font-bold text-gray-800">{t.pageTitle}</h1>
        </div>
        <LangToggle lang={lang} onChange={switchLang} />
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
                      placeholder={t.phonePlaceholder}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <input
                      value={editForm.plate}
                      onChange={e => setEditForm({ ...editForm, plate: e.target.value })}
                      placeholder={t.platePlaceholder}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-52 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">{t.btnSave}</button>
                      <button onClick={() => setEditing(false)} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200">{t.btnCancel}</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-gray-800">{driver.name}</h2>
                      {!driver.is_active && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{t.inactive}</span>
                      )}
                    </div>
                    {driver.phone && <p className="text-gray-500 text-sm mt-0.5">{driver.phone}</p>}
                    <p className="text-gray-500 text-xs mt-1">{t.added(new Date(driver.created_at).toLocaleDateString())}</p>
                  </>
                )}
              </div>
            </div>
            {!editing && (
              <div className="flex gap-2">
                <button onClick={() => setEditing(true)} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors">
                  {t.btnEdit}
                </button>
                <button
                  onClick={toggleActive}
                  className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    driver.is_active ? 'bg-red-50 hover:bg-red-100 text-red-600' : 'bg-green-50 hover:bg-green-100 text-green-700'
                  }`}
                >
                  {driver.is_active ? t.btnDeactivate : t.btnReactivate}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 mb-1">{t.vehiclePlate}</p>
              {driver.vehicle_plate
                ? <span className="font-mono font-semibold bg-gray-100 px-2 py-1 rounded text-sm">{driver.vehicle_plate}</span>
                : <span className="text-gray-500 text-sm">—</span>}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">{t.vehicleModel}</p>
              <p className="font-medium text-gray-800 text-sm">{driver.vehicle_model || '—'}</p>
              {driver.vehicle_year && <p className="text-xs text-gray-600">{driver.vehicle_year}</p>}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">{t.avgRating}</p>
              {driver.avg_stars !== null
                ? <div className="flex items-center gap-1"><Stars value={Math.round(driver.avg_stars)} size="sm" /><span className="text-sm font-semibold">{driver.avg_stars.toFixed(1)}</span></div>
                : <span className="text-gray-500 text-sm">{t.noReviews}</span>}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">{t.totalReviews}</p>
              <p className="text-2xl font-bold text-gray-800">{driver.total_reviews}</p>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">{t.qrTitle}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{t.qrSubtitle(driver.name)}</p>
            </div>
            <button
              onClick={() => setQrVisible(!qrVisible)}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              {qrVisible ? t.hideQr : t.showQr}
            </button>
          </div>
          {qrVisible && (
            <div className="mt-4 flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/admin/qr/${id}`} alt="QR code" className="w-56 h-56 rounded-xl border border-gray-100" />
              <p className="text-xs text-gray-500 mt-2">{t.qrHint}</p>
            </div>
          )}
        </div>

        {/* Feedback */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-800">{t.feedbackTitle}</h3>
              {negativeCount > 0 && (
                <p className="text-xs text-red-500 mt-0.5">{t.negativeCount(negativeCount)}</p>
              )}
            </div>
            <div className="flex gap-1">
              {(['all', 'positive', 'negative'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    filter === f
                      ? f === 'negative' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' ? t.filterAll : f === 'positive' ? t.filterPositive : t.filterNegative}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-8">{t.noFilteredReviews(filter)}</p>
          ) : (
            <div className="space-y-3">
              {filtered.map(r => (
                <div key={r.id} className={`rounded-xl p-4 border ${r.stars <= 2 ? 'border-red-100 bg-red-50' : 'border-gray-100 bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <Stars value={r.stars} size="sm" />
                    <span className="text-xs text-gray-600">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  {r.comment && <p className="text-gray-700 text-sm mt-2">{r.comment}</p>}
                  <div className="mt-2 pt-2 border-t border-gray-200/50 space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">👤 {r.customer_name || t.anonymous}</span>
                      {r.customer_contact && <span className="text-xs text-gray-400">📞 {r.customer_contact}</span>}
                    </div>
                    {(r.route_from || r.route_to) && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <span>🗺</span>
                        {r.route_from && <span className="text-green-600">{r.route_from}</span>}
                        {r.route_from && r.route_to && <span>→</span>}
                        {r.route_to && <span className="text-red-500">{r.route_to}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
