import Layout from '@/components/Layout';

// 상단 네비게이션(topbar)이 있는 공통 레이아웃. login/signup 은 이 그룹 밖이라 topbar가 없다.
export default function MainLayout({ children }) {
  return <Layout>{children}</Layout>;
}
