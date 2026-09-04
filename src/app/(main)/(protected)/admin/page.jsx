import { redirect } from 'next/navigation';

// 기존 라우터의 /admin -> /admin/schedule 리다이렉트
export default function AdminIndex() {
  redirect('/admin/schedule');
}
