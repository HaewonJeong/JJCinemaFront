import { redirect } from 'next/navigation';

// 기존 라우터의 "/" -> "/movies" 리다이렉트
export default function Home() {
  redirect('/movies');
}
