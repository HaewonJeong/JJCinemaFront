import { redirect } from 'next/navigation';

// 기존 라우터의 catch-all(path="*") -> "/movies" 리다이렉트
export default function NotFound() {
  redirect('/movies');
}
