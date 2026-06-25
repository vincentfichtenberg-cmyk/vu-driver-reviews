'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Driver {
  id: number;
  name: string;
  vehicle_plate: string | null;
  vehicle_model: string | null;
}

export default function RatePage() {
  const params = useParams();
  const driverId = params.driverId as string;

  const [driver, setDriver] = useState<Driver | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/drivers/${driverId}/public`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setDriver)
      .catch(() => setNotFound(true));
  }, [driverId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (stars === 0) { setError('Please select a star rating.'); return; }
    setLoading(true);
    setError('');
    const res = await fetch('/api/rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId: Number(driverId), stars, comment }),
    });
    if (res.ok) {
      setSubmitted(true);
    } else {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8">
        <div className="text-6xl mb-4">🚗</div>
        <h1 className="text-2xl font-bold text-gray-700">Driver not found</h1>
        <p className="text-gray-500 mt-2">This QR code is invalid or the driver no longer exists.</p>
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
        <h1 className="text-2xl font-bold text-gray-800">Thank you!</h1>
        <p className="text-gray-500 mt-2">Your feedback for <strong>{driver.name}</strong> has been submitted.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl">🚗</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">Rate Your Driver</h1>
            <p className="text-gray-500 text-sm mt-1">VU Transportation</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between text-sm">
              <div>
                <p className="text-gray-500">Driver</p>
                <p className="font-semibold text-gray-800">{driver.name}</p>
              </div>
              {driver.vehicle_plate && (
                <div className="text-right">
                  <p className="text-gray-500">Vehicle</p>
                  <p className="font-semibold text-gray-800">{driver.vehicle_plate}</p>
                  {driver.vehicle_model && <p className="text-xs text-gray-400">{driver.vehicle_model}</p>}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3 text-center">How was your trip?</p>
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
                    <span className={n <= (hovered || stars) ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                  </button>
                ))}
              </div>
              {stars > 0 && (
                <p className="text-center text-sm text-gray-500 mt-2">
                  {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][stars]}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments (optional)
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Share your experience..."
                rows={3}
                maxLength={500}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              />
            </div>

            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">VU Transportation Service</p>
      </div>
    </div>
  );
}
