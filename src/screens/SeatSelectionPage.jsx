'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { createBooking } from '../api/bookings';
import { getMovie } from '../api/movies';
import { getSeatMap } from '../api/showtimes';
import NotFoundState from '../components/NotFoundState';

export default function SeatSelectionPage() {
  const { showtimeId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [seatData, setSeatData] = useState(null);
  const [movie, setMovie] = useState(null);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('loading'); // loading | ok | notfound

  async function refresh() {
    const data = await getSeatMap(showtimeId);
    setSeatData(data);
    if (data.showtime) {
      const m = await getMovie(data.showtime.movieId);
      setMovie(m);
    }
    return data;
  }

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    refresh()
      .then(() => {
        if (!cancelled) setStatus('ok');
      })
      .catch(() => {
        if (!cancelled) setStatus('notfound');
      });
    return () => {
      cancelled = true;
    };
  }, [showtimeId]);

  function toggleSeat(seat) {
    if (seat.status === '예약됨') return;
    setSelected((prev) =>
      prev.includes(seat.code) ? prev.filter((c) => c !== seat.code) : [...prev, seat.code]
    );
  }

  async function handleConfirm() {
    if (selected.length === 0) return;
    setSubmitting(true);
    setError('');
    try {
      const booking = await createBooking(user.id, showtimeId, selected);
      router.push(`/payment/${booking.id}`);
    } catch (err) {
      setError(err.message);
      setSelected([]);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading') return null;
  if (status === 'notfound' || !seatData || !seatData.showtime) {
    return (
      <NotFoundState
        title="존재하지 않는 상영입니다"
        message="요청하신 상영 회차를 찾을 수 없습니다. 삭제되었거나 잘못된 주소일 수 있습니다."
      />
    );
  }

  const { showtime, rows, cols, seats } = seatData;
  const totalPrice = selected.length * showtime.price;

  return (
    <div className="page">
      <button className="btn-back" onClick={() => router.push(`/movies/${seatData.showtime.movieId}`)}>← 상영 시간표</button>

      <h1 className="page-title">{movie?.title}</h1>
      <p className="page-subtitle">{showtime.date} · {showtime.time} · {showtime.theater}</p>

      <div className="seat-panel">
        <div className="screen-bar">SCREEN</div>

        <div className="seat-grid">
          {rows.map((row) => (
            <div className="seat-row" key={row}>
              <span className="seat-row-label">{row}</span>
              {cols.map((col) => {
                const seat = seats.find((s) => s.code === `${row}${col}`);
                const isSelected = selected.includes(seat.code);
                const cls =
                  'seat' +
                  (seat.status === '예약됨' ? ' seat-taken' : isSelected ? ' seat-selected' : ' seat-available');
                return (
                  <button
                    key={seat.code}
                    className={cls}
                    disabled={seat.status === '예약됨'}
                    onClick={() => toggleSeat(seat)}
                    aria-label={`${seat.code} 좌석`}
                  >
                    {col}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="seat-legend">
          <span><i className="legend-swatch legend-available" /> 선택 가능</span>
          <span><i className="legend-swatch legend-selected" /> 선택됨</span>
          <span><i className="legend-swatch legend-taken" /> 예약됨</span>
        </div>
      </div>

      <div className="booking-summary">
        <div>
          <span className="summary-label">선택한 좌석</span>
          <span className="summary-value">{selected.length > 0 ? selected.join(', ') : '없음'}</span>
        </div>
        <div>
          <span className="summary-label">결제 금액</span>
          <span className="summary-value">{totalPrice.toLocaleString()}원</span>
        </div>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary" disabled={selected.length === 0 || submitting} onClick={handleConfirm}>
          {submitting ? '좌석 선점 중...' : `${selected.length}석 결제하러 가기`}
        </button>
      </div>
    </div>
  );
}
