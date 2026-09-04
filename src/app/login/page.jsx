import { Suspense } from 'react';
import LoginPage from '@/screens/LoginPage';

// useSearchParams를 쓰는 클라이언트 화면은 Suspense 경계가 필요하다
export default function Page() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
