import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Sends logged-out visitors to /login
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">Loading...</div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}