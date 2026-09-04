'use client';

import { usePathname } from 'next/navigation';
import NavLink from './NavLink';

const MOVIE_SUBTABS = [
  { label: '등록된 영화', to: '/admin/movies' },
  { label: '영화 등록', to: '/admin/movies/new' },
  { label: '상영 등록', to: '/admin/showtimes/new' },
  { label: '상영 관리', to: '/admin/showtimes' },
];

function isMovieSection(pathname) {
  return pathname.startsWith('/admin/movies') || pathname.startsWith('/admin/showtimes');
}

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const tabClass = ({ isActive }) => 'admin-tab' + (isActive ? ' active' : '');
  const subtabClass = ({ isActive }) => 'admin-subtab' + (isActive ? ' active' : '');
  const inMovieSection = isMovieSection(pathname);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <h1 className="page-title">관리자</h1>
        <p className="page-subtitle">영화·상영을 등록하고 좌석 점유율과 매출을 확인하세요</p>

        <nav className="admin-tabs">
          <NavLink href="/admin/schedule" className={tabClass} end>스케줄·매출</NavLink>

          <NavLink href="/admin/movies" className={'admin-tab' + (inMovieSection ? ' active' : '')}>영화 관리</NavLink>
          {inMovieSection && (
            <div className="admin-subtabs">
              {MOVIE_SUBTABS.map((tab) => (
                <NavLink key={tab.to} href={tab.to} className={subtabClass} end>
                  {tab.label}
                </NavLink>
              ))}
            </div>
          )}

          <NavLink href="/admin/users" className={tabClass} end>회원 관리</NavLink>
        </nav>
      </aside>

      <div className="admin-main">
        {children}
      </div>
    </div>
  );
}
