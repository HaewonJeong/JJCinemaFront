import { ProtectedRoute } from '@/components/ProtectedRoute';

// 로그인이 필요한 화면(booking / payment / my-bookings / admin) 공통 가드
export default function ProtectedLayout({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
