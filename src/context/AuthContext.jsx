/** @file AuthContext.jsx
 * @description Shared role identity and verified server-session lifecycle.
 */
import { createContext, useEffect, useState } from 'react';
import api, { setAuthToken } from '../api/axiosInstance';
import { getAccessToken, endSession, clearSession, startSession, tokenClaims } from '../api/sessionClient';
import i18n, { RTL_LANGUAGES } from '../i18n/i18n.js';
import { configureLocale, configureDateFormat } from '../utils/dateFormat.js';
import { configureGradeFormat } from '../utils/gradeFormat.js';
import { setThemeMode } from '../theme/themeMode.js';

const SECURE = location.protocol === 'https:' ? ';Secure' : '';

// Apply language + locale settings BEFORE React tree renders — prevents flash
function applyLanguage(lang, timezone, preferredLocale, dateFormat) {
  if (!lang) return;
  i18n.changeLanguage(lang);
  document.documentElement.lang = lang;
  document.documentElement.dir  = RTL_LANGUAGES.includes(lang) ? 'rtl' : 'ltr';
  document.cookie = `erp_lang=${lang};path=/;SameSite=Lax;max-age=31536000${SECURE}`;
  localStorage.setItem('erp_language', lang);
  configureLocale(lang, timezone, preferredLocale);
  configureDateFormat(dateFormat);
}

// The established public context export is consumed by hooks and role layouts.
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(undefined);

// User type to endpoint mapping
const USER_TYPE_ENDPOINTS = {
  admin: '/admin/login',
  // Directors authenticate through the shared admin endpoint (no /director/login
  // exists on the backend — the admin module issues tokens for ADMIN and DIRECTOR).
  director: '/admin/login',
  manager: '/campus/login',
  teacher: '/teachers/login',
  student: '/students/login',
  parent: '/parents/login',
  mentor: '/mentors/login',
  staff: '/staff/login',
  partner: '/partners/auth/login',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clear = () => setUser(null);
    const changed = (event) => {
      if (event.key === 'token' && tokenClaims(event.oldValue)?.sid !== tokenClaims(event.newValue)?.sid) window.location.reload();
    };
    window.addEventListener('erp-session-cleared', clear);
    window.addEventListener('storage', changed);
    return () => {
      window.removeEventListener('erp-session-cleared', clear);
      window.removeEventListener('storage', changed);
    };
  }, []);

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

      const responseData = await startSession(endpoint, credentials);

      const { token, user: userData } = responseData.data;

      // Add user type to user data
      const enrichedUserData = {
        ...userData,
        userType, // Store user type for future reference
      };

      // Apply language + locale BEFORE state update — zero flash on login
      if (enrichedUserData.preferredLanguage) {
        applyLanguage(
          enrichedUserData.preferredLanguage,
          enrichedUserData.timezone,
          enrichedUserData.preferredLocale,
          enrichedUserData.dateFormat,
        );
      }
      configureGradeFormat(enrichedUserData.gradeFormat);
      setThemeMode(enrichedUserData.theme);

      // Save to localStorage
      localStorage.setItem('token', token);
      setAuthToken(token);
      localStorage.setItem('user', JSON.stringify(enrichedUserData));
      localStorage.setItem('userType', userType);

      // Update state
      setUser(enrichedUserData);

      return responseData;
    } catch (error) {
      console.error('❌ Login error:', error);
      throw new Error(error.response?.data?.message || error.message);
    }
  };

  /**
   * Logout function
   */
  const logout = async () => {
    await endSession();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    localStorage.removeItem('erp_language');
    document.cookie = 'erp_lang=;path=/;SameSite=Lax;max-age=0';
    i18n.changeLanguage('en');
    document.documentElement.lang = 'en';
    document.documentElement.dir  = 'ltr';
    setUser(null);

    window.location.href = '/login';
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
          await getAccessToken();
          const isValid = (await api.get('/account/session')).data.success;

          if (isValid) {
            const parsedUser = JSON.parse(savedUser);
            // Restore language + locale from cache — prevents flash on first render
            if (parsedUser.preferredLanguage) {
              applyLanguage(
                parsedUser.preferredLanguage,
                parsedUser.timezone,
                parsedUser.preferredLocale,
                parsedUser.dateFormat,
              );
            }
            configureGradeFormat(parsedUser.gradeFormat);
            setThemeMode(parsedUser.theme);
            setUser(parsedUser);

            // Background resync from server — reconciles multi-device preference changes
            api.get('/settings')
              .then((r) => r.data)
              .then(({ data }) => {
                if (!data) return;
                const { preferredLanguage, timezone, preferredLocale, dateFormat, gradeFormat, theme } = data;
                const changed =
                  preferredLanguage !== parsedUser.preferredLanguage ||
                  timezone          !== parsedUser.timezone          ||
                  preferredLocale   !== parsedUser.preferredLocale   ||
                  dateFormat        !== parsedUser.dateFormat        ||
                  gradeFormat       !== parsedUser.gradeFormat       ||
                  theme             !== parsedUser.theme;
                if (changed) {
                  if (preferredLanguage) applyLanguage(preferredLanguage, timezone, preferredLocale, dateFormat);
                  configureGradeFormat(gradeFormat);
                  setThemeMode(theme);
                  setUser((prev) => {
                    const updated = { ...prev, preferredLanguage, timezone, preferredLocale, dateFormat, gradeFormat, theme };
                    localStorage.setItem('user', JSON.stringify(updated));
                    return updated;
                  });
                }
              })
              .catch(() => {});
          } else {
            clearSession();
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        clearSession();
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

      localStorage.setItem('user', JSON.stringify(updatedUser));
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