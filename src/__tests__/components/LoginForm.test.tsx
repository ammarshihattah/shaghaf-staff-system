import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthContext } from '../../hooks/useAuth';
import LoginForm from '../../components/LoginForm';

const mockAuthContext = {
  user: null,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
};

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <LoginForm />
      </AuthContext.Provider>
    );

    expect(screen.getByText('شغف للعمل المشترك')).toBeInTheDocument();
    expect(screen.getByLabelText('البريد الإلكتروني')).toBeInTheDocument();
    expect(screen.getByLabelText('كلمة المرور')).toBeInTheDocument();
    expect(screen.getByLabelText('الفرع')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'تسجيل الدخول' })).toBeInTheDocument();
  });

  it('calls login function when form is submitted', async () => {
    mockAuthContext.login.mockResolvedValue(true);

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <LoginForm />
      </AuthContext.Provider>
    );

    fireEvent.change(screen.getByLabelText('البريد الإلكتروني'), {
      target: { value: 'admin@shaghaf.eg' },
    });
    fireEvent.change(screen.getByLabelText('كلمة المرور'), {
      target: { value: 'password' },
    });
    fireEvent.change(screen.getByLabelText('الفرع'), {
      target: { value: '1' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'تسجيل الدخول' }));

    await waitFor(() => {
      expect(mockAuthContext.login).toHaveBeenCalledWith('admin@shaghaf.eg', 'password', '1');
    });
  });

  it('shows error message on failed login', async () => {
    mockAuthContext.login.mockResolvedValue(false);

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <LoginForm />
      </AuthContext.Provider>
    );

    fireEvent.change(screen.getByLabelText('البريد الإلكتروني'), {
      target: { value: 'wrong@email.com' },
    });
    fireEvent.change(screen.getByLabelText('كلمة المرور'), {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'تسجيل الدخول' }));

    await waitFor(() => {
      expect(screen.getByText('فشل في تسجيل الدخول. يرجى المحاولة مرة أخرى.')).toBeInTheDocument();
    });
  });
});