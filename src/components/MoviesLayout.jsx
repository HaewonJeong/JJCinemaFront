import { NavLink, Outlet } from 'react-router-dom';

const TABS = [
  { to: '/movies/now-showing', label: '현재상영작' },
  { to: '/movies/upcoming', label: '개봉예정작' },
];

export default function MoviesLayout() {
  const tabClass = ({ isActive }) => 'movie-tab' + (isActive ? ' active' : '');

  return (
    <div className="movies-layout">
      <aside className="movie-sidebar">
        <h1 className="page-title">영화</h1>
        <p className="page-subtitle">보고 싶은 영화를 골라 상영 시간표를 확인하세요</p>

        <div className="movie-tabs">
          {TABS.map((tab) => (
            <NavLink key={tab.to} to={tab.to} className={tabClass}>
              {tab.label}
            </NavLink>
          ))}
        </div>
      </aside>

      <div className="movie-content">
        <Outlet />
      </div>
    </div>
  );
}
