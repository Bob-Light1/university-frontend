import { createContext, useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/env';
import i18n, { RTL_LANGUAGES } from '../i18n/i18n.js';

// Apply language preference BEFORE React tree renders — prevents language flash
function applyLanguage(lang) {
  if (!lang) return;
  i18n.changeLanguage(lang);
  document.documentElement.lang = lang;
  document.documentElement.dir  = RTL_LANGUAGES.includes(lang) ? 'rtl' : 'ltr';
  document.cookie = `erp_lang=${lang};path=/;SameSite=Lax;max-age=31536000`;
  localStorage.setItem('erp_language', lang);
}

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
  staff: '/staff/login',
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

      // Apply language BEFORE state update — zero flash on login
      if (enrichedUserData.preferredLanguage) {
        applyLanguage(enrichedUserData.preferredLanguage);
      }

      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(enrichedUserData));
      localStorage.setItem('userType', userType);

      // Update state
      setUser(enrichedUserData);

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
   * Verify token validity by decoding it client-side and checking expiry.
   * Does NOT verify the signature (impossible without the secret) — the backend
   * will reject any tampered/expired token on the first API call anyway.
   */
  const verifyToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      // JWT structure: header.payload.signature (base64url encoded)
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      // Decode payload (base64url → JSON)
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
      );

      // Reject if already expired
      if (payload.exp && payload.exp * 1000 < Date.now()) return false;

      return true;
    } catch {
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
          const isValid = verifyToken();

          if (isValid) {
            const parsedUser = JSON.parse(savedUser);
            // Restore language preference on page reload — before first render
            if (parsedUser.preferredLanguage) {
              applyLanguage(parsedUser.preferredLanguage);
            }
            setUser(parsedUser);
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