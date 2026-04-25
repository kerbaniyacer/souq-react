import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@features/auth/stores/authStore';

interface Props {
  children: React.ReactNode;
}

/**
 * OnboardingGuard — wraps protected routes.
 * If the logged-in user has not completed their profile (is_onboarded = false),
 * they are redirected to /complete-profile.
 */
export default function OnboardingGuard({ children }: Props) {
  const { isAuthenticated, user, profileLoading } = useAuthStore();

  // Not logged in — let PrivateRoute handle this
  if (!isAuthenticated) return <>{children}</>;

  // Still loading profile and don't have user data — wait
  if (profileLoading && !user) return null;

  // Admins and staff are always allowed
  if (user?.is_staff) return <>{children}</>;

  // Check onboarding status from the user object (populated at login)
  const isOnboarded = (user as any)?.is_onboarded ?? true;

  if (!isOnboarded) {
    return <Navigate to="/complete-profile" replace />;
  }

  return <>{children}</>;
}
