import { useEffect, useState } from 'react';
import { getAllShowtimesAdmin } from '../api/showtimes';
import { getBookingStats } from '../api/admin';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 10;

export default function AdminSchedulePage() {
  const [stats, setStats] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    getBookingStats().then(setStats);
    getAllShowtimesAdmin().then(setShowtimes);
  }, []);

  const totalPages = Math.max(1, Math.ceil(showtimes.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = showtimes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      <div className="stat-row">
        <div className="stat-card"><span className="stat-num">{stats?.todayBookingCount ?? 0}</span><span className="stat-label">오늘 예매 건수</span></div>
        <div className="stat-card"><span className="stat-num">{(stats?.todayRevenue ?? 0).toLocaleString()}</span><span className="stat-label">오늘 매출(원)</span></div>
        <div className="stat-card"><span className="stat-num">{stats?.totalSeatsSold ?? 0}</span><span className="stat-label">누적 판매 좌석</span></div>
        <div className="stat-card"><span className="stat-num">{(stats?.totalRevenue ?? 0).toLocaleString()}</span><span className="stat-label">누적 매출(원)</span></div>
      </div>

      <div className="panel">
        <h2 className="panel-title">전체 상영 스케줄 · 좌석 점유율</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>영화</th>
              <th>날짜</th>
              <th>시간</th>
              <th>상영관</th>
              <th>예매 좌석</th>
              <th>점유율</th>
            </tr>
          </thead>
          <tbody>
            {showtimes.length === 0 && (
              <tr><td colSpan={6} className="empty-cell">등록된 상영 스케줄이 없습니다.</td></tr>
            )}
            {pageItems.map((s) => {
              const pct = Math.round((s.bookedSeats / s.totalSeats) * 100);
              return (
                <tr key={s.id}>
                  <td>{s.movieTitle}</td>
                  <td>{s.date}</td>
                  <td>{s.time}</td>
                  <td>{s.theater}</td>
                  <td>{s.bookedSeats} / {s.totalSeats}</td>
                  <td>
                    <div className="occupancy-bar">
                      <div className="occupancy-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="occupancy-pct">{pct}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
      </div>
    </>
  );
}
