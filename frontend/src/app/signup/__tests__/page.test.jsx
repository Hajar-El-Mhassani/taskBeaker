import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import SignupPage from '../page';
import { useAuth } from '@/context/AuthContext';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock AuthContext
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock Navbar component
jest.mock('@/components/Navbar', () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

describe('SignupPage', () => {
  let mockPush;
  let mockSignup;

  beforeEach(() => {
    mockPush = jest.fn();
    mockSignup = jest.fn();

    useRouter.mockReturnValue({
      push: mockPush,
    });

    useAuth.mockReturnValue({
      signup: mockSignup,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Validation', () => {
    it('should render signup form with name, email and password fields', () => {
      render(<SignupPage />);

      expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('should require email field', () => {
      render(<SignupPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should require password field', () => {
      render(<SignupPage />);

      const passwordInput = screen.getByLabelText(/^password$/i);
      expect(passwordInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should display password requirements hint', () => {
      render(<SignupPage />);

      expect(
        screen.getByText(/must be at least 8 characters/i)
      ).toBeInTheDocument();
    });

    it('should update name input value when user types', () => {
      render(<SignupPage />);

      const nameInput = screen.getByLabelText(/^name$/i);
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });

      expect(nameInput.value).toBe('John Doe');
    });

    it('should update email input value when user types', () => {
      render(<SignupPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      expect(emailInput.value).toBe('test@example.com');
    });

    it('should update password input value when user types', () => {
      render(<SignupPage />);

      const passwordInput = screen.getByLabelText(/^password$/i);
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });

      expect(passwordInput.value).toBe('Password123!');
    });
  });

  describe('Error Display', () => {
    it('should display error message when signup fails', async () => {
      const errorMessage = 'Email already exists';
      mockSignup.mockRejectedValue(new Error(errorMessage));

      render(<SignupPage />);

      const nameInput = screen.getByLabelText(/^name$/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should display generic error message when error has no message', async () => {
      mockSignup.mockRejectedValue(new Error());

      render(<SignupPage />);

      const nameInput = screen.getByLabelText(/^name$/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to create account/i)).toBeInTheDocument();
      });
    });

    it('should clear error message when user retries', async () => {
      mockSignup.mockRejectedValueOnce(new Error('Weak password'));

      render(<SignupPage />);

      const nameInput = screen.getByLabelText(/^name$/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      // First attempt - fails
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'weak' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Weak password')).toBeInTheDocument();
      });

      // Second attempt - should clear error
      mockSignup.mockResolvedValueOnce({});
      fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Weak password')).not.toBeInTheDocument();
      });
    });

    it('should display password validation error', async () => {
      const errorMessage =
        'Password must be at least 8 characters with uppercase, lowercase, and numbers';
      mockSignup.mockRejectedValue(new Error(errorMessage));

      render(<SignupPage />);

      const nameInput = screen.getByLabelText(/^name$/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'weak' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Successful Authentication Flow', () => {
    it('should call signup function with email, password, and name', async () => {
      mockSignup.mockResolvedValue({});

      render(<SignupPage />);

      const nameInput = screen.getByLabelText(/^name$/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith(
          'test@example.com',
          'Password123!',
          'John Doe'
        );
      });
    });

    it('should redirect to dashboard on successful signup', async () => {
      mockSignup.mockResolvedValue({});

      render(<SignupPage />);

      const nameInput = screen.getByLabelText(/^name$/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should show loading state during signup', async () => {
      mockSignup.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<SignupPage />);

      const nameInput = screen.getByLabelText(/^name$/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.click(submitButton);

      // Check loading state
      expect(screen.getByText(/creating account/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryByText(/creating account/i)).not.toBeInTheDocument();
      });
    });

    it('should prevent form submission when already loading', async () => {
      mockSignup.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<SignupPage />);

      const nameInput = screen.getByLabelText(/^name$/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });

      // Click multiple times
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Navigation', () => {
    it('should render link to login page', () => {
      render(<SignupPage />);

      const loginLink = screen.getByText(/already have an account/i);
      expect(loginLink).toBeInTheDocument();
    });
  });
});
