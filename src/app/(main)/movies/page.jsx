import { redirect } from 'next/navigation';

// 기존 라우터의 /movies -> /movies/now-showing 리다이렉트
export default function MoviesIndex() {
  redirect('/movies/now-showing');
}
