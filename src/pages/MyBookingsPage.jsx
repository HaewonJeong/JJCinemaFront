import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cancelBooking, getMyBookings } from '../api/mockApi';

function StatusPill({ status, holdExpired, paymentStatus }) {
  if (status === '결제대기') {
    return (
      <span className={'pill ' + (holdExpired ? 'pill-neutral' : 'pill-warning')}>
        {holdExpired ? '결제 만료' : '결제 대기'}
      </span>
    );
  }
  if (status === '취소됨') {
    return <span className="pill pill-danger">{paymentStatus === '환불됨' ? '환불됨' : '취소됨'}</span>;
  }
  return <span className="pill pill-success">예매완료</span>;
}

export default function MyBookingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [busyId, setBusyId] = useState(null);

  async function refresh() {
    const list = await getMyBookings(user.id);
    setBookings(list);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCancel(id) {
    setBusyId(id);
    try {
      await cancelBooking(id);
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="booking-list">
      {bookings.length === 0 && <p className="empty-cell">예매 내역이 없습니다.</p>}
      {bookings.map((b) => (
        <div className="booking-item" key={b.id}>
          <div className="booking-poster">
            {b.moviePosterUrl ? <img src={b.moviePosterUrl} alt={b.movieTitle} /> : b.moviePoster}
          </div>
          <div className="booking-detail">
            <span className="booking-title">{b.movieTitle}</span>
            <span className="booking-meta">
              {b.showtime?.date} · {b.showtime?.time} · {b.showtime?.theater}
            </span>
            <span className="booking-meta">좌석 {b.seatIds.join(', ')} · {b.totalPrice.toLocaleString()}원</span>
          </div>
          <div className="booking-actions">
            <StatusPill status={b.status} holdExpired={b.holdExpired} paymentStatus={b.paymentStatus} />
            {b.status === '결제대기' && !b.holdExpired && (
              <>
                <button className="btn btn-sm btn-primary" onClick={() => navigate(`/payment/${b.id}`)}>
                  결제하러 가기
                </button>
                <button className="btn btn-sm btn-outline" disabled={busyId === b.id} onClick={() => handleCancel(b.id)}>
                  취소
                </button>
              </>
            )}
            {b.status === '예매완료' && (
              <button className="btn btn-sm btn-outline" disabled={busyId === b.id} onClick={() => handleCancel(b.id)}>
                예매 취소
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
