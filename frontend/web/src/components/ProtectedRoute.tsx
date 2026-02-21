import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 100%)` }}
      >
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: theme.colors.primary, borderTopColor: 'transparent' }}></div>
          <p style={{ color: theme.colors.textSecondary }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If a specific role is required and user doesn't have it, redirect to dashboard
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  // Force new users to complete the health assessment before accessing the app
  // Skip this check if the user is already on the health-assessment page or is a guest/admin
  if (
    user.hasCompletedAssessment === false &&
    !user.isGuest &&
    user.role !== 'admin' &&
    location.pathname !== '/health-assessment'
  ) {
    return <Navigate to="/health-assessment" replace />;
  }

  return <>{children}</>;
}
