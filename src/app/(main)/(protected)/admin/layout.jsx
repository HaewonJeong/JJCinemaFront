import { AdminRoute } from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';

export default function Layout({ children }) {
  return (
    <AdminRoute>
      <AdminLayout>{children}</AdminLayout>
    </AdminRoute>
  );
}
