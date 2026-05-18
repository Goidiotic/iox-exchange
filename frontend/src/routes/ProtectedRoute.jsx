import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  return isAuthenticated && token && token !== 'demo.jwt.token' ? <Outlet /> : <Navigate to="/login" replace />;
}
