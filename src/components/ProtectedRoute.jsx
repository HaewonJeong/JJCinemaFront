'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) return null;
  return children;
}

export function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    //admin이 아닌 유저가 로그인 할 경우 AdminRoute에서 이동
    if (user.role !== 'admin') router.replace('/movies');
  }, [loading, user, router]);

  if (loading || !user || user.role !== 'admin') return null;
  return children;
}
