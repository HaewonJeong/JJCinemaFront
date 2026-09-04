'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { cancelBooking, createPayment, getBooking } from '../api/bookings';
import NotFoundState from '../components/NotFoundState';

function formatRemaining(ms) {
  const clamped = Math.max(ms, 0);
  const mm = String(Math.floor(clamped / 60000)).padStart(2, '0');
  const ss = String(Math.floor((clamped % 60000) / 1000)).padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function PaymentPage() {
  const { bookingId } = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState(null);
  const [remainingMs, setRemainingMs] = useState(null); // null = 아직 계산 전 (초기값 0이면 "만료됨"이 깜빡임)
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentFailed, setPaymentFailed] = useState(false); // 결제 실패 후엔 좌석을 자동 취소하지 않는다 (남은 시간 안에 재시도 가능)
  const [status, setStatus] = useState('loading'); // loading | ok | notfound

  const refresh = useCallback(async () => {
    const data = await getBooking(bookingId);
    setBooking(data);
    return data;
  }, [bookingId]);

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
  }, [refresh]);

  useEffect(() => {
    if (!booking) return undefined;
    // 서버가 준 '남은 초'로 클라 기준 마감시각을 한 번 고정한다 (타임존/시계오차 무관).
    // 구버전 응답 대비 holdExpiresAt(절대시각) 폴백.
    const deadline =
      booking.holdRemainingSeconds != null
        ? Date.now() + booking.holdRemainingSeconds * 1000
        : booking.holdExpiresAt
          ? new Date(booking.holdExpiresAt).getTime()
          : null;
    if (deadline == null) return undefined;
    const tick = () => setRemainingMs(deadline - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [booking]);

  async function releaseAndGo(path) {
    // 결제를 한 번이라도 실패했으면 좌석을 붙잡아 둔다 — 임시선점 남은 시간 안에
    // 다시 결제 페이지로 돌아와 재시도할 수 있어야 하므로. (만료되면 백엔드가 알아서 푼다.)
    if (booking.status === '결제대기' && !paymentFailed) {
      try {
        await cancelBooking(bookingId);
      } catch {
        // 이미 처리된 예매라면 무시하고 이동
      }
    }
    router.push(path);
  }

  async function handlePay(forceResult) {
    setProcessing(true);
    setError('');
    try {
      await createPayment(bookingId, forceResult);
      router.push('/my-bookings');
    } catch (err) {
      setError(err.message);
      setPaymentFailed(true);
      await refresh();
    } finally {
      setProcessing(false);
    }
  }

  if (status === 'loading') return null;
  if (status === 'notfound' || !booking) {
    return (
      <NotFoundState
        title="존재하지 않는 예매입니다"
        message="요청하신 예매 정보를 찾을 수 없습니다. 이미 취소되었거나 잘못된 주소일 수 있습니다."
        actionLabel="내 예매 내역으로"
        actionTo="/my-bookings"
      />
    );
  }

  if (booking.status === '예매완료') {
    return (
      <div className="page">
        <h1 className="page-title">결제 완료</h1>
        <p className="page-subtitle">이미 결제가 완료된 예매입니다.</p>
        <button className="btn btn-outline" onClick={() => router.push('/my-bookings')}>내 예매 내역으로</button>
      </div>
    );
  }

  if (booking.status === '취소됨') {
    return (
      <div className="page">
        <h1 className="page-title">결제 실패</h1>
        <p className="page-subtitle">{error || '좌석 임시선점이 취소되었거나 만료되었습니다.'}</p>
        <button className="btn btn-primary" onClick={() => router.push(`/booking/${booking.showtimeId}`)}>
          좌석 다시 선택하기
        </button>
      </div>
    );
  }

  const expired = remainingMs !== null && remainingMs <= 0;

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
          <span className="summary-value">
            {remainingMs === null ? '확인 중…' : expired ? '만료됨' : formatRemaining(remainingMs)}
          </span>
        </div>

        {error && <p className="form-error">{error}</p>}
        {paymentFailed && !expired && (
          <p className="form-hint">좌석은 위 남은 시간 동안 그대로 유지됩니다. 다시 결제해 주세요.</p>
        )}

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
