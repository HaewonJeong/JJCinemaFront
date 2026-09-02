import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  //admin이 아닌 유저가 로그인 할 경우 AdminRoute에서 이동
  if (user.role !== 'admin') return <Navigate to="/movies" replace />; 
  return <Outlet />; 
}
