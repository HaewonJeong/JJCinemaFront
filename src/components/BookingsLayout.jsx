'use client';

import NavLink from './NavLink';

export default function BookingsLayout({ children }) {
  const tabClass = ({ isActive }) => 'movie-tab' + (isActive ? ' active' : '');

  return (
    <div className="bookings-layout">
      <aside className="bookings-sidebar">
        <h1 className="page-title">예매</h1>
        <p className="page-subtitle">예매한 영화와 좌석을 확인하세요</p>

        <div className="movie-tabs">
          <NavLink href="/my-bookings" end className={tabClass}>내 예매 내역</NavLink>
        </div>
      </aside>

      <div className="bookings-content">
        {children}
      </div>
    </div>
  );
}
