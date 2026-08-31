import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getShowtime, updateShowtime } from '../api/mockApi';

export default function AdminShowtimeEditPage() {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getShowtime(showtimeId).then((s) => {
      if (s) {
        setForm({
          movieTitle: s.movieTitle,
          date: s.date,
          time: s.time,
          theater: s.theater,
          price: String(s.price),
        });
      }
    });
  }, [showtimeId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateShowtime(showtimeId, {
        date: form.date,
        time: form.time,
        theater: form.theater,
        price: Number(form.price) || 0,
      });
      navigate('/admin/showtimes');
    } finally {
      setSubmitting(false);
    }
  }

  if (!form) return null;

  return (
    <div className="panel">
      <h2 className="panel-title">상영 수정 — {form.movieTitle}</h2>
      <form onSubmit={handleSubmit}>
        <div className="admin-form">
          <div>
            <label className="field-label">날짜</label>
            <input
              className="text-input"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="field-label">시간</label>
            <input
              className="text-input"
              type="time"
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="field-label">상영관</label>
            <input
              className="text-input"
              value={form.theater}
              onChange={(e) => setForm((f) => ({ ...f, theater: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="field-label">가격(원)</label>
            <input
              className="text-input"
              type="number"
              min="0"
              step="1000"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              required
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? '저장 중…' : '수정 저장'}
        </button>
      </form>
    </div>
  );
}
