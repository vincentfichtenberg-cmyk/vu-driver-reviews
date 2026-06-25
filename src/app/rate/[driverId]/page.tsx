'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Driver {
  id: number;
  name: string;
  vehicle_plate: string | null;
  vehicle_model: string | null;
}

type Lang = 'en' | 'vi';

const T = {
  en: {
    title: 'Rate Your Driver',
    subtitle: 'VU Transportation',
    driver: 'Driver',
    vehicle: 'Vehicle',
    howWasTrip: 'How was your trip?',
    labels: ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'],
    commentsLabel: 'Comments (optional)',
    placeholder: 'Share your experience...',
    yourInfo: 'Your Information (optional)',
    yourInfoHint: 'Help us follow up on your feedback.',
    namePlaceholder: 'Your name',
    contactPlaceholder: 'Phone or email',
    routeSection: 'Trip Route (optional)',
    routeFromPlaceholder: 'Pickup location (e.g. 123 Main St)',
    routeToPlaceholder: 'Drop-off location (e.g. Airport)',
    submit: 'Submit Review',
    submitting: 'Submitting...',
    thankYou: 'Thank you!',
    feedbackSubmitted: (name: string) => `Your feedback for ${name} has been submitted.`,
    notFound: 'Driver not found',
    notFoundMsg: 'This QR code is invalid or the driver no longer exists.',
    errorStar: 'Please select a star rating.',
    errorGeneral: 'Something went wrong. Please try again.',
    footer: 'VU Transportation Service',
  },
  vi: {
    title: 'Đánh Giá Tài Xế',
    subtitle: 'Vận Tải VU',
    driver: 'Tài xế',
    vehicle: 'Xe',
    howWasTrip: 'Chuyến đi của bạn thế nào?',
    labels: ['', 'Tệ', 'Tạm được', 'Tốt', 'Rất tốt', 'Xuất sắc'],
    commentsLabel: 'Nhận xét (tùy chọn)',
    placeholder: 'Chia sẻ trải nghiệm của bạn...',
    yourInfo: 'Thông tin của bạn (tùy chọn)',
    yourInfoHint: 'Giúp chúng tôi theo dõi phản hồi của bạn.',
    namePlaceholder: 'Tên của bạn',
    contactPlaceholder: 'Số điện thoại hoặc email',
    routeSection: 'Lộ trình (tùy chọn)',
    routeFromPlaceholder: 'Điểm đón (vd. 123 Nguyễn Huệ)',
    routeToPlaceholder: 'Điểm đến (vd. Sân bay)',
    submit: 'Gửi đánh giá',
    submitting: 'Đang gửi...',
    thankYou: 'Cảm ơn bạn!',
    feedbackSubmitted: (name: string) => `Phản hồi của bạn cho ${name} đã được gửi.`,
    notFound: 'Không tìm thấy tài xế',
    notFoundMsg: 'Mã QR này không hợp lệ hoặc tài xế không còn tồn tại.',
    errorStar: 'Vui lòng chọn số sao.',
    errorGeneral: 'Có lỗi xảy ra. Vui lòng thử lại.',
    footer: 'Dịch vụ vận tải VU',
  },
};

export default function RatePage() {
  const params = useParams();
  const driverId = params.driverId as string;

  const [lang, setLang] = useState<Lang>('vi');
  const [driver, setDriver] = useState<Driver | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [routeFrom, setRouteFrom] = useState('');
  const [routeTo, setRouteTo] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const t = T[lang];

  useEffect(() => {
    const saved = localStorage.getItem('vu-lang') as Lang | null;
    if (saved === 'en' || saved === 'vi') setLang(saved);
  }, []);

  function switchLang(l: Lang) {
    setLang(l);
    localStorage.setItem('vu-lang', l);
  }

  useEffect(() => {
    fetch(`/api/drivers/${driverId}/public`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setDriver)
      .catch(() => setNotFound(true));
  }, [driverId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (stars === 0) { setError(t.errorStar); return; }
    setLoading(true);
    setError('');
    const res = await fetch('/api/rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId: Number(driverId), stars, comment, customerName, customerContact, routeFrom, routeTo }),
    });
    if (res.ok) {
      setSubmitted(true);
    } else {
      setError(t.errorGeneral);
    }
    setLoading(false);
  }

  // Language toggle component
  const LangToggle = () => (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1 text-xs font-medium">
      <button
        onClick={() => switchLang('vi')}
        className={`px-2.5 py-1 rounded-md transition-colors ${lang === 'vi' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
      >
        🇻🇳 VI
      </button>
      <button
        onClick={() => switchLang('en')}
        className={`px-2.5 py-1 rounded-md transition-colors ${lang === 'en' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
      >
        🇬🇧 EN
      </button>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8">
        <div className="absolute top-4 right-4"><LangToggle /></div>
        <div className="text-6xl mb-4">🚗</div>
        <h1 className="text-2xl font-bold text-gray-700">{t.notFound}</h1>
        <p className="text-gray-500 mt-2">{t.notFoundMsg}</p>
      </div>
    </div>
  );

  if (!driver) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="text-center p-8 max-w-sm">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-800">{t.thankYou}</h1>
        <p className="text-gray-500 mt-2">{t.feedbackSubmitted(driver.name)}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-md">
        {/* Language toggle */}
        <div className="flex justify-end mb-3">
          <LangToggle />
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl">🚗</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">{t.title}</h1>
            <p className="text-gray-500 text-sm mt-1">{t.subtitle}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between text-sm">
              <div>
                <p className="text-gray-500">{t.driver}</p>
                <p className="font-semibold text-gray-800">{driver.name}</p>
              </div>
              {driver.vehicle_plate && (
                <div className="text-right">
                  <p className="text-gray-500">{t.vehicle}</p>
                  <p className="font-semibold text-gray-800">{driver.vehicle_plate}</p>
                  {driver.vehicle_model && <p className="text-xs text-gray-600">{driver.vehicle_model}</p>}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3 text-center">{t.howWasTrip}</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setStars(n)}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    className="text-4xl transition-transform hover:scale-110"
                  >
                    <span className={n <= (hovered || stars) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                  </button>
                ))}
              </div>
              {stars > 0 && (
                <p className="text-center text-sm text-gray-500 mt-2">
                  {t.labels[stars]}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.commentsLabel}
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder={t.placeholder}
                rows={3}
                maxLength={500}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              />
            </div>

            <div className="mb-6 bg-gray-50 rounded-xl p-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-0.5">{t.yourInfo}</p>
                <p className="text-xs text-gray-500 mb-3">{t.yourInfoHint}</p>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    maxLength={100}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <input
                    type="text"
                    value={customerContact}
                    onChange={e => setCustomerContact(e.target.value)}
                    placeholder={t.contactPlaceholder}
                    maxLength={100}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">{t.routeSection}</p>
                <div className="space-y-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 text-sm">●</span>
                    <input
                      type="text"
                      value={routeFrom}
                      onChange={e => setRouteFrom(e.target.value)}
                      placeholder={t.routeFromPlaceholder}
                      maxLength={200}
                      className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 text-sm">●</span>
                    <input
                      type="text"
                      value={routeTo}
                      onChange={e => setRouteTo(e.target.value)}
                      placeholder={t.routeToPlaceholder}
                      maxLength={200}
                      className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? t.submitting : t.submit}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-500 mt-4">{t.footer}</p>
      </div>
    </div>
  );
}
