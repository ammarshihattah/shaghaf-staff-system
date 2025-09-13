import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '../types';
import { apiClient } from '../lib/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, branch_id: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            setUser(JSON.parse(userData));
          } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      }
    } catch (error) {
      console.error('Error in auth initialization:', error);
    } finally {
      // Auto-login with default admin user if no user is found
      const currentToken = localStorage.getItem('token');
      const currentUser = localStorage.getItem('user');
      
      if (!currentToken || !currentUser) {
        const defaultUser = {
          id: '1',
          name: 'مدير النظام',
          email: 'admin@shaghaf.eg',
          role: 'admin',
          branch_id: '1'
        };
        
        const mockToken = 'auto-login-token-' + Date.now();
        
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(defaultUser));
        setUser(defaultUser);
        
        console.log('🔓 Auto-login enabled: Logged in as admin automatically');
      }
      
      setLoading(false);
    }
  }, []);
  const login = async (email: string, password: string, branch_id: string): Promise<{ success: boolean; message?: string }> => {
    try {
      console.log('🔄 Attempting login with:', { email, branch_id });
      setLoading(true);
      
      const response = await apiClient.login(email, password, branch_id);
      console.log('✅ Login successful:', response);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      setLoading(false);
      return { success: true };
    } catch (error) {
      console.error('❌ Login failed:', error);
      setLoading(false);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'فشل في الاتصال بالخادم' 
      };
    }
  };

  const logout = () => {
    try {
      // Clear all authentication data from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Clear any other potential auth-related data
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      
      // Update state
      setUser(null);
      
      // Force a page reload to ensure clean state
      window.location.reload();
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback: force reload even if localStorage operations fail
      window.location.reload();
    }
  };

  return {
    user,
    login,
    logout,
    loading
  };
};

export { AuthContext };