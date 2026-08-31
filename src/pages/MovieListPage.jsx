import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMovies } from '../api/mockApi';

export default function MovieListPage({ status }) {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getMovies().then(setMovies);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return movies
      .filter((m) => m.status === status)
      .filter((m) => !q || m.title?.toLowerCase().includes(q) || m.genre?.toLowerCase().includes(q));
  }, [movies, status, search]);

  return (
    <>
      <div className="search-field">
        <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          className="text-input"
          placeholder="제목 또는 장르로 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 && (
        <p className="empty-cell">해당 조건의 영화가 없습니다.</p>
      )}

      <div className="movie-grid">
        {filtered.map((m) =>
          status === '상영예정' ? (
            <div key={m.id} className="movie-card movie-card-disabled">
              <div className="movie-poster">
                {m.posterUrl ? <img src={m.posterUrl} alt={m.title} /> : (m.poster || '🎬')}
              </div>
              <div className="movie-info">
                <span className="movie-title">{m.title}</span>
                <span className="movie-meta">{m.genre} · {m.runtime}분 · {m.rating}</span>
                <p className="movie-synopsis">{m.synopsis}</p>
              </div>
            </div>
          ) : (
            <button key={m.id} className="movie-card" onClick={() => navigate(`/movies/${m.id}`)}>
              <div className="movie-poster">
                {m.posterUrl ? <img src={m.posterUrl} alt={m.title} /> : (m.poster || '🎬')}
              </div>
              <div className="movie-info">
                <span className="movie-title">{m.title}</span>
                <span className="movie-meta">{m.genre} · {m.runtime}분 · {m.rating}</span>
                <p className="movie-synopsis">{m.synopsis}</p>
              </div>
            </button>
          ),
        )}
      </div>
    </>
  );
}
