'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { deleteMovie, getAllMovies } from '../api/movies';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 10;

export default function AdminMoviesPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAllMovies().then((list) => {
      setMovies(list);
      setLoading(false);
    });
  }, []);

  function handleSearchChange(value) {
    setSearch(value);
    setPage(1);
  }

  const filteredMovies = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return movies;
    return movies.filter(
      (m) => m.title?.toLowerCase().includes(q) || m.genre?.toLowerCase().includes(q),
    );
  }, [movies, search]);

  const totalPages = Math.max(1, Math.ceil(filteredMovies.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredMovies.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="panel">
      <div className="panel-header-row">
        <h2 className="panel-title">등록된 영화</h2>
        <Link href="/admin/movies/new" className="btn btn-sm btn-primary">+ 영화 등록</Link>
      </div>

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
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>포스터</th>
            <th>제목</th>
            <th>장르</th>
            <th>개봉일</th>
            <th>관람등급</th>
            <th>상태</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {!loading && filteredMovies.length === 0 && (
            <tr>
              <td colSpan={7} className="empty-cell">
                {search ? '검색 결과가 없습니다.' : '등록된 영화가 없습니다.'}
              </td>
            </tr>
          )}
          {pageItems.map((m) => (
            <tr key={m.id}>
              <td>
                <div className="poster-preview poster-preview-sm">
                  {m.posterUrl ? <img src={m.posterUrl} alt={m.title} /> : (m.poster || '🎬')}
                </div>
              </td>
              <td>{m.title}</td>
              <td>{m.genre}</td>
              <td>{m.releaseDate}</td>
              <td>{m.rating}</td>
              <td>{m.status}</td>
              <td>
                <Link href={`/admin/movies/${m.id}/edit`} className="btn btn-sm btn-outline">수정</Link>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={async () => {
                    if (!confirm(`"${m.title}"을(를) 삭제할까요?`)) return;
                    try {
                      await deleteMovie(m.id);
                      alert('삭제되었습니다.');
                      getAllMovies().then(setMovies);
                    } catch (err) {
                      alert(err.message);
                    }
                  }}
                >
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
