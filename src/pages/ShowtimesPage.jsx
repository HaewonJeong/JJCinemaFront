import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMovie, getShowtimes } from '../api/mockApi';

export default function ShowtimesPage() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    getMovie(movieId).then(setMovie);
    getShowtimes(movieId).then((list) => {
      setShowtimes(list);
      if (list.length > 0) setSelectedDate(list[0].date);
    });
  }, [movieId]);

  const dates = useMemo(() => Array.from(new Set(showtimes.map((s) => s.date))), [showtimes]);
  const filtered = showtimes.filter((s) => s.date === selectedDate);

  if (!movie) return null;

  return (
    <div className="page">
      <button className="btn-back" onClick={() => navigate('/movies')}>← 영화 목록</button>

      <div className="movie-header">
        <div className="movie-poster movie-poster-lg">
          {movie.posterUrl ? <img src={movie.posterUrl} alt={movie.title} /> : (movie.poster || '🎬')}
        </div>
        <div>
          <h1 className="page-title">{movie.title}</h1>
          <p className="page-subtitle">{movie.genre} · {movie.runtime}분 · {movie.rating}</p>
          <p className="page-subtitle" style={{ marginTop: -18 }}>감독 {movie.director} · 개봉일 {movie.releaseDate}</p>
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
