import { createContext, useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/env';

export const AuthContext = createContext(undefined);

// User type to endpoint mapping
const USER_TYPE_ENDPOINTS = {
  admin: '/admin/login',
  director: '/director/login',
  manager: '/campus/login',
  teacher: '/teachers/login',
  student: '/students/login',
  parent: '/parents/login',
  mentor: '/mentors/login',
  partner: '/partners/login',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Universal login function
   * @param {Object} credentials - { email, password } or { username, password }
   * @param {string} userType - 'admin', 'student', 'teacher', ...
   */

  const login = async (credentials, userType = 'manager') => {
    try {
      // Get the appropriate endpoint for user type
      const endpoint = USER_TYPE_ENDPOINTS[userType];
      
      if (!endpoint) {
        throw new Error(`Invalid user type: ${userType}`);
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Login failed');
      }

      const { token, user: userData } = responseData.data;

      // Add user type to user data
      const enrichedUserData = {
        ...userData,
        userType, // Store user type for future reference
      };

      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(enrichedUserData));
      localStorage.setItem('userType', userType);

      // Update state
      setUser(enrichedUserData);

      console.log('✅ Login successful:', enrichedUserData);

      return responseData;
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  /**
   * Logout function
   */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    setUser(null);
    
    // Redirect to login
    window.location.href = '/login';
  };

  /**
   * Verify token validity
   * @param {string} userType - Type of user to verify
   */
  const verifyToken = async (userType) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      // Optional: Call API to verify token based on user type
      // For now, we just check if token exists
      // You can implement specific verification endpoints later:
      // GET /api/campus/verify
      // GET /api/student/verify
      // GET /api/teacher/verify

      return true;
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      return false;
    }
  };

  /**
   * Initialize authentication on mount
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        const savedUserType = localStorage.getItem('userType');

        if (token && savedUser && savedUserType) {
          // Verify token is still valid
          const isValid = await verifyToken(savedUserType);

          if (isValid) {
            setUser(JSON.parse(savedUser));
            console.log('✅ User restored from localStorage');
          } else {
            // Token expired or invalid
            console.warn('⚠️ Token invalid, logging out');
            logout();
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Update user data
   * @param {Object} newData - New user data to merge
   */
  const updateUser = (newData) => {
    setUser((prev) => {
      const updatedUser = { ...prev, ...newData };

      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      console.log('✅ User updated:', updatedUser);
      
      return updatedUser;
    });
  };

  /**
   * Get user's role (extracted from user object)
   */
  const getUserRole = () => {
    return user?.role || user?.roles?.[0] || null;
  };

  /**
   * Get user type (campus, student, teacher...)
   */
  const getUserType = () => {
    return user?.userType || localStorage.getItem('userType');
  };

  /**
   * Check if user has specific role
   * @param {string|Array} roles - Role(s) to check
   */
  const hasRole = (roles) => {
    if (!user) return false;
    
    const userRole = getUserRole();
    const roleArray = Array.isArray(roles) ? roles : [roles];
    
    return roleArray.includes(userRole);
  };

  /**
   * Check if user is specific type
   * @param {string|Array} types - Type(s) to check
   */
  const isUserType = (types) => {
    if (!user) return false;
    
    const userType = getUserType();
    const typeArray = Array.isArray(types) ? types : [types];
    
    return typeArray.includes(userType);
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    loading,
    isAuthenticated: !!user,
    getUserRole,
    getUserType,
    hasRole,
    isUserType,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;