'use client';

import { useRouter } from 'next/navigation';

// 존재하지 않는 리소스(없는 movieId/showtimeId/bookingId 등)를 조회했을 때
// 빈 화면 대신 보여줄 안내 화면.
export default function NotFoundState({
  title = '찾을 수 없습니다',
  message = '요청하신 정보가 존재하지 않거나 삭제되었습니다.',
  actionLabel = '영화 목록으로',
  actionTo = '/movies',
}) {
  const router = useRouter();
  return (
    <div className="page">
      <h1 className="page-title">{title}</h1>
      <p className="page-subtitle" style={{ margin: '8px 0 20px' }}>{message}</p>
      <button className="btn btn-primary" onClick={() => router.push(actionTo)}>
        {actionLabel}
      </button>
    </div>
  );
}
