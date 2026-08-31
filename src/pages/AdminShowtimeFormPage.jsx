import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createShowtime, getMovies } from '../api/mockApi';

const MAX_SLOTS = 10;

export default function AdminShowtimeFormPage() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [movieId, setMovieId] = useState('');
  const [theater, setTheater] = useState('');
  const [price, setPrice] = useState('14000');
  const [slots, setSlots] = useState([{ date: '', time: '' }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getMovies().then(setMovies);
  }, []);

  function updateSlot(idx, field, value) {
    setSlots((list) => list.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  }

  function addSlot() {
    setSlots((list) => (list.length >= MAX_SLOTS ? list : [...list, { date: '', time: '' }]));
  }

  function removeSlot(idx) {
    setSlots((list) => (list.length <= 1 ? list : list.filter((_, i) => i !== idx)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validSlots = slots.filter((s) => s.date && s.time);
    if (validSlots.length === 0) return;
    setSubmitting(true);
    try {
      for (const slot of validSlots) {
        await createShowtime({
          movieId,
          date: slot.date,
          time: slot.time,
          theater,
          price: Number(price) || 14000,
        });
      }
      navigate('/admin/schedule');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="panel">
      <h2 className="panel-title">상영 등록</h2>
      <form onSubmit={handleSubmit}>
        <div className="admin-form">
          <div className="field-full">
            <label className="field-label">영화</label>
            <select
              className="text-input"
              value={movieId}
              onChange={(e) => setMovieId(e.target.value)}
              required
            >
              <option value="" disabled>영화를 선택하세요</option>
              {movies.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>

          <div>
            <label className="field-label">상영관</label>
            <input
              className="text-input"
              placeholder="예: 1관"
              value={theater}
              onChange={(e) => setTheater(e.target.value)}
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
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
        </div>

        <label className="field-label">상영 날짜·시간 (최대 {MAX_SLOTS}개)</label>
        <div className="showtime-slot-list">
          {slots.map((slot, idx) => (
            <div className="showtime-slot-row" key={idx}>
              <input
                className="text-input"
                type="date"
                value={slot.date}
                onChange={(e) => updateSlot(idx, 'date', e.target.value)}
              />
              <input
                className="text-input"
                type="time"
                value={slot.time}
                onChange={(e) => updateSlot(idx, 'time', e.target.value)}
              />
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => removeSlot(idx)}
                disabled={slots.length <= 1}
              >
                삭제
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={addSlot}
          disabled={slots.length >= MAX_SLOTS}
        >
          + 날짜·시간 추가 ({slots.length}/{MAX_SLOTS})
        </button>

        <button type="submit" className="btn btn-primary" disabled={submitting || movies.length === 0}>
          {submitting ? '등록 중…' : `상영 등록 (${slots.filter((s) => s.date && s.time).length}건)`}
        </button>
      </form>
    </div>
  );
}
