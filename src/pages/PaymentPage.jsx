import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cancelBooking, createPayment, getBooking } from '../api/mockApi';

function formatRemaining(ms) {
  const clamped = Math.max(ms, 0);
  const mm = String(Math.floor(clamped / 60000)).padStart(2, '0');
  const ss = String(Math.floor((clamped % 60000) / 1000)).padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    const data = await getBooking(bookingId);
    setBooking(data);
    return data;
  }, [bookingId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!booking?.holdExpiresAt) return undefined;
    const tick = () => setRemainingMs(new Date(booking.holdExpiresAt).getTime() - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [booking]);

  async function releaseAndGo(path) {
    if (booking.status === '결제대기') {
      try {
        await cancelBooking(bookingId);
      } catch {
        // 이미 처리된 예매라면 무시하고 이동
      }
    }
    navigate(path);
  }

  async function handlePay(forceResult) {
    setProcessing(true);
    setError('');
    try {
      await createPayment(bookingId, forceResult);
      navigate('/my-bookings');
    } catch (err) {
      setError(err.message);
      await refresh();
    } finally {
      setProcessing(false);
    }
  }

  if (!booking) return null;

  if (booking.status === '예매완료') {
    return (
      <div className="page">
        <h1 className="page-title">결제 완료</h1>
        <p className="page-subtitle">이미 결제가 완료된 예매입니다.</p>
        <button className="btn btn-outline" onClick={() => navigate('/my-bookings')}>내 예매 내역으로</button>
      </div>
    );
  }

  if (booking.status === '취소됨') {
    return (
      <div className="page">
        <h1 className="page-title">결제 실패</h1>
        <p className="page-subtitle">{error || '좌석 임시선점이 취소되었거나 만료되었습니다.'}</p>
        <button className="btn btn-primary" onClick={() => navigate(`/booking/${booking.showtimeId}`)}>
          좌석 다시 선택하기
        </button>
      </div>
    );
  }

  const expired = remainingMs <= 0;

  return (
    <div className="page">
      <button className="btn-back" onClick={() => releaseAndGo(`/booking/${booking.showtimeId}`)}>← 좌석 선택</button>

      <h1 className="page-title">결제하기</h1>
      <p className="page-subtitle">
        {booking.movieTitle} · {booking.showtime?.date} {booking.showtime?.time} · {booking.showtime?.theater}
      </p>

      <div className="booking-summary">
        <div>
          <span className="summary-label">좌석</span>
          <span className="summary-value">{booking.seatIds.join(', ')}</span>
        </div>
        <div>
          <span className="summary-label">결제 금액</span>
          <span className="summary-value">{booking.totalPrice.toLocaleString()}원</span>
        </div>
        <div>
          <span className="summary-label">좌석 임시선점 남은 시간</span>
          <span className="summary-value">{expired ? '만료됨' : formatRemaining(remainingMs)}</span>
        </div>

        {error && <p className="form-error">{error}</p>}

        {expired ? (
          <button className="btn btn-primary" onClick={() => releaseAndGo(`/booking/${booking.showtimeId}`)}>
            좌석 다시 선택하기
          </button>
        ) : (
          <>
            <button className="btn btn-primary" disabled={processing} onClick={() => handlePay('SUCCESS')}>
              {processing ? '결제 처리 중...' : '결제하기 (모의)'}
            </button>
            <button className="btn btn-outline btn-sm" disabled={processing} onClick={() => handlePay('FAILED')}>
              결제 실패 시뮬레이션
            </button>
          </>
        )}
      </div>
    </div>
  );
}
