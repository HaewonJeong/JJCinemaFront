import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMovie } from '../api/movies';
import { getShowtimes } from '../api/showtimes';
import NotFoundState from '../components/NotFoundState';

export default function ShowtimesPage() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ok | notfound

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    getMovie(movieId)
      .then((m) => {
        if (cancelled) return;
        if (!m) {
          setStatus('notfound');
          return;
        }
        setMovie(m);
        setStatus('ok');
      })
      .catch(() => {
        if (!cancelled) setStatus('notfound');
      });
    getShowtimes(movieId)
      .then((list) => {
        if (cancelled) return;
        setShowtimes(list);
        if (list.length > 0) setSelectedDate(list[0].date);
      })
      .catch(() => {
        if (!cancelled) setShowtimes([]);
      });
    return () => {
      cancelled = true;
    };
  }, [movieId]);

  const dates = useMemo(() => Array.from(new Set(showtimes.map((s) => s.date))), [showtimes]);
  const filtered = showtimes.filter((s) => s.date === selectedDate);

  if (status === 'loading') return null;
  if (status === 'notfound' || !movie) {
    return (
      <NotFoundState
        title="존재하지 않는 영화입니다"
        message="요청하신 영화를 찾을 수 없습니다. 삭제되었거나 잘못된 주소일 수 있습니다."
      />
    );
  }

  return (
    <div className="page">
      <button className="btn-back" onClick={() => navigate('/movies')}>← 영화 목록</button>

      <div className="movie-header">
        <div className="movie-poster movie-poster-lg">
          {movie.posterUrl ? <img src={movie.posterUrl} alt={movie.title} /> : (movie.poster || '🎬')}
        </div>
        <div>
          <h1 className="page-title">{movie.title}</h1>
          <p className="page-subtitle" style={{ margin: '6px 0 0' }}>{movie.genre} · {movie.runtime}분 · {movie.rating}</p>
          <p className="movie-sub-meta">감독 {movie.director} · 개봉일 {movie.releaseDate}</p>
          <p className="movie-synopsis-full">{movie.synopsis}</p>
        </div>
      </div>

      <div className="date-tabs">
        {dates.map((d) => (
          <button
            key={d}
            className={'date-tab' + (d === selectedDate ? ' active' : '')}
            onClick={() => setSelectedDate(d)}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="showtime-list">
        {filtered.map((s) => (
          <button key={s.id} className="showtime-card" onClick={() => navigate(`/booking/${s.id}`)}>
            <span className="showtime-time">{s.time}</span>
            <span className="showtime-theater">{s.theater}</span>
            <span className="showtime-price">{s.price.toLocaleString()}원</span>
          </button>
        ))}
        {filtered.length === 0 && <p className="empty-cell">해당 날짜의 상영 시간이 없습니다.</p>}
      </div>
    </div>
  );
}
