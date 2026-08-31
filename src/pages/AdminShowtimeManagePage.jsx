import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllShowtimesAdmin, updateShowtimesBulk } from '../api/mockApi';

export default function AdminShowtimeManagePage() {
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState({});
  const [bulkTheater, setBulkTheater] = useState({});
  const [bulkPrice, setBulkPrice] = useState({});
  const [applyingMovieId, setApplyingMovieId] = useState(null);

  async function refresh() {
    setLoading(true);
    const list = await getAllShowtimesAdmin();
    setShowtimes(list);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const groups = useMemo(() => {
    const map = new Map();
    showtimes.forEach((s) => {
      if (!map.has(s.movieId)) map.set(s.movieId, { movieId: s.movieId, movieTitle: s.movieTitle, items: [] });
      map.get(s.movieId).items.push(s);
    });
    return Array.from(map.values()).sort((a, b) => a.movieTitle.localeCompare(b.movieTitle));
  }, [showtimes]);

  function toggle(id) {
    setSelected((sel) => ({ ...sel, [id]: !sel[id] }));
  }

  function toggleAll(items, checked) {
    setSelected((sel) => {
      const next = { ...sel };
      items.forEach((s) => { next[s.id] = checked; });
      return next;
    });
  }

  async function applyBulk(group) {
    const ids = group.items.filter((s) => selected[s.id]).map((s) => s.id);
    if (ids.length === 0) return;

    const patch = {};
    const theaterVal = (bulkTheater[group.movieId] || '').trim();
    const priceVal = (bulkPrice[group.movieId] || '').trim();
    if (theaterVal) patch.theater = theaterVal;
    if (priceVal) patch.price = Number(priceVal) || 0;
    if (Object.keys(patch).length === 0) return;

    setApplyingMovieId(group.movieId);
    try {
      await updateShowtimesBulk(ids, patch);
      setSelected((sel) => {
        const next = { ...sel };
        ids.forEach((id) => { delete next[id]; });
        return next;
      });
      setBulkTheater((v) => ({ ...v, [group.movieId]: '' }));
      setBulkPrice((v) => ({ ...v, [group.movieId]: '' }));
      await refresh();
    } finally {
      setApplyingMovieId(null);
    }
  }

  if (!loading && groups.length === 0) {
    return (
      <div className="panel">
        <p className="empty-cell">등록된 상영 스케줄이 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      {groups.map((group) => {
        const selectedCount = group.items.filter((s) => selected[s.id]).length;
        const allChecked = group.items.length > 0 && selectedCount === group.items.length;

        return (
          <div className="panel" key={group.movieId}>
            <div className="panel-header-row">
              <h2 className="panel-title">{group.movieTitle}</h2>
              <span className="panel-count">{group.items.length}건</span>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={(e) => toggleAll(group.items, e.target.checked)}
                    />
                  </th>
                  <th>날짜</th>
                  <th>시간</th>
                  <th>상영관</th>
                  <th>가격</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <input type="checkbox" checked={!!selected[s.id]} onChange={() => toggle(s.id)} />
                    </td>
                    <td>{s.date}</td>
                    <td>{s.time}</td>
                    <td>{s.theater}</td>
                    <td>{s.price.toLocaleString()}원</td>
                    <td>
                      <Link to={`/admin/showtimes/${s.id}/edit`} className="btn btn-sm btn-outline">수정</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="bulk-edit-bar">
              <span className="bulk-edit-label">선택 {selectedCount}건 일괄 변경</span>
              <input
                className="text-input"
                placeholder="상영관 (비우면 유지)"
                value={bulkTheater[group.movieId] || ''}
                onChange={(e) => setBulkTheater((v) => ({ ...v, [group.movieId]: e.target.value }))}
              />
              <input
                className="text-input"
                type="number"
                min="0"
                step="1000"
                placeholder="가격 (비우면 유지)"
                value={bulkPrice[group.movieId] || ''}
                onChange={(e) => setBulkPrice((v) => ({ ...v, [group.movieId]: e.target.value }))}
              />
              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={selectedCount === 0 || applyingMovieId === group.movieId}
                onClick={() => applyBulk(group)}
              >
                {applyingMovieId === group.movieId ? '적용 중…' : '선택 항목에 적용'}
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
}
