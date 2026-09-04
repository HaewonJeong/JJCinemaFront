'use client';

import { useRouter } from 'next/navigation';
import NavLink from './NavLink';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  const navClass = ({ isActive }) => 'nav-link' + (isActive ? ' active' : '');

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand">🎬 JJCinema</span>
          <nav className="topnav">
            <NavLink href="/movies" className={navClass}>영화</NavLink>
            {user && <NavLink href="/my-bookings" className={navClass}>내 예매</NavLink>}
            {user?.role === 'admin' && (
              <NavLink href="/admin" className={navClass}>관리자</NavLink>
            )}
          </nav>
          {user ? (
            <div className="user-box">
              <span className="user-name">{user.name}</span>
              <span className={'role-badge ' + (user.role === 'admin' ? 'role-admin' : 'role-customer')}>
                {user.role === 'admin' ? '관리자' : '고객'}
              </span>
              <button className="btn btn-ghost" onClick={handleLogout}>로그아웃</button>
            </div>
          ) : (
            <div className="user-box">
              <button className="btn btn-ghost btn-sm" onClick={() => router.push('/signup')}>회원가입</button>
              <button className="btn btn-outline btn-sm" onClick={() => router.push('/login')}>로그인</button>
            </div>
          )}
        </div>
      </header>
      <main className="content">
        {children}
      </main>
    </div>
  );
}
