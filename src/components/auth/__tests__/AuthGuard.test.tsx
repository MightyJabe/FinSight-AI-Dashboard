import { render, screen, waitFor } from '@testing-library/react';

import { AuthGuard } from '../AuthGuard';
import { useSession } from '@/components/providers/SessionProvider';

// Create mock functions
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockPrefetch = jest.fn();
const mockBack = jest.fn();

// Mock next/navigation before importing component
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: mockPrefetch,
    back: mockBack,
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock dependencies
jest.mock('@/components/providers/SessionProvider');
jest.mock('@/components/common/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

describe('AuthGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading is true', () => {
      (useSession as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
      });

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.getByTestId('loading-spinner')).toBeTruthy();
      expect(screen.queryByText('Protected Content')).toBeNull();
    });

    it('should not redirect while loading', () => {
      (useSession as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
      });

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Unauthenticated User', () => {
    it('should redirect to /login when user is null and not loading', async () => {
      (useSession as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('should not render children when user is null', () => {
      (useSession as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.queryByText('Protected Content')).toBeNull();
    });
  });

  describe('Authenticated User', () => {
    const mockUser = {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      emailVerified: true,
    };

    it('should render children when user is authenticated', () => {
      (useSession as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
      });

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.getByText('Protected Content')).toBeTruthy();
    });

    it('should not redirect when user is authenticated', () => {
      (useSession as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
      });

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Email Verification', () => {
    it('should redirect to /verify-email when email is not verified and verification is required', async () => {
      const unverifiedUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: false,
      };

      (useSession as jest.Mock).mockReturnValue({
        user: unverifiedUser,
        loading: false,
      });

      render(
        <AuthGuard requireEmailVerification={true}>
          <div>Protected Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/verify-email');
      });
    });

    it('should render children when email is verified and verification is required', () => {
      const verifiedUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: true,
      };

      (useSession as jest.Mock).mockReturnValue({
        user: verifiedUser,
        loading: false,
      });

      render(
        <AuthGuard requireEmailVerification={true}>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.getByText('Protected Content')).toBeTruthy();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should render children when email is not verified but verification is not required', () => {
      const unverifiedUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: false,
      };

      (useSession as jest.Mock).mockReturnValue({
        user: unverifiedUser,
        loading: false,
      });

      render(
        <AuthGuard requireEmailVerification={false}>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.getByText('Protected Content')).toBeTruthy();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should not redirect when verification is not required by default', () => {
      const unverifiedUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: false,
      };

      (useSession as jest.Mock).mockReturnValue({
        user: unverifiedUser,
        loading: false,
      });

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.getByText('Protected Content')).toBeTruthy();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('State Transitions', () => {
    it('should handle transition from loading to authenticated', async () => {
      const { rerender } = render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      // Initial loading state
      (useSession as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
      });

      rerender(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.getByTestId('loading-spinner')).toBeTruthy();

      // Transition to authenticated
      (useSession as jest.Mock).mockReturnValue({
        user: {
          uid: 'test-user-id',
          email: 'test@example.com',
          emailVerified: true,
        },
        loading: false,
      });

      rerender(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).toBeNull();
        expect(screen.getByText('Protected Content')).toBeTruthy();
      });
    });

    it('should handle transition from loading to unauthenticated', async () => {
      const { rerender } = render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      // Initial loading state
      (useSession as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
      });

      rerender(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.getByTestId('loading-spinner')).toBeTruthy();

      // Transition to unauthenticated
      (useSession as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });

      rerender(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Complex Children', () => {
    it('should render complex child components when authenticated', () => {
      (useSession as jest.Mock).mockReturnValue({
        user: {
          uid: 'test-user-id',
          email: 'test@example.com',
          emailVerified: true,
        },
        loading: false,
      });

      render(
        <AuthGuard>
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back!</p>
            <button>Action Button</button>
          </div>
        </AuthGuard>
      );

      expect(screen.getByText('Dashboard')).toBeTruthy();
      expect(screen.getByText('Welcome back!')).toBeTruthy();
      expect(screen.getByText('Action Button')).toBeTruthy();
    });

    it('should render multiple child elements when authenticated', () => {
      (useSession as jest.Mock).mockReturnValue({
        user: {
          uid: 'test-user-id',
          email: 'test@example.com',
          emailVerified: true,
        },
        loading: false,
      });

      render(
        <AuthGuard>
          <div>First Child</div>
          <div>Second Child</div>
          <div>Third Child</div>
        </AuthGuard>
      );

      expect(screen.getByText('First Child')).toBeTruthy();
      expect(screen.getByText('Second Child')).toBeTruthy();
      expect(screen.getByText('Third Child')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle user object with undefined emailVerified when verification not required', () => {
      const userWithoutEmailVerified = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: undefined,
      };

      (useSession as jest.Mock).mockReturnValue({
        user: userWithoutEmailVerified,
        loading: false,
      });

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.getByText('Protected Content')).toBeTruthy();
    });

    it('should handle rapid state changes', async () => {
      const { rerender } = render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      // Rapid state changes
      (useSession as jest.Mock).mockReturnValue({ user: null, loading: true });
      rerender(<AuthGuard><div>Protected Content</div></AuthGuard>);

      (useSession as jest.Mock).mockReturnValue({ user: null, loading: false });
      rerender(<AuthGuard><div>Protected Content</div></AuthGuard>);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible loading state', () => {
      (useSession as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
      });

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toBeTruthy();
      expect(spinner.parentElement?.className).toContain('min-h-screen');
    });

    it('should maintain proper DOM structure', () => {
      (useSession as jest.Mock).mockReturnValue({
        user: {
          uid: 'test-user-id',
          email: 'test@example.com',
          emailVerified: true,
        },
        loading: false,
      });

      const { container } = render(
        <AuthGuard>
          <div data-testid="content">Protected Content</div>
        </AuthGuard>
      );

      const content = screen.getByTestId('content');
      expect(content).toBeTruthy();
      expect(container.firstChild).toBeTruthy();
    });
  });
});
