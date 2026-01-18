"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

// Define types
interface User {
  _id: string;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  isAdmin?: boolean;
  isExpert?: boolean;
  expertId?: string;
  type: string;
  wallet?: number;
  [key: string]: unknown; // For other fields that may have any type
}

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  user: User | null;
  logout: () => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  loading: true,
  user: null,
  logout: () => {},
});

// The Auth Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // Function to handle logout
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setUser(null);
    router.push("/login");
  }, [router]);

  // Set up interceptor for 401 responses
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // Token expired or invalid, log out
          logout();
        }
        return Promise.reject(error);
      }
    );

    // Check token on mount
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Always fetch the latest user profile to get current subscription status
        const response = await axios.get("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Use the user type directly from the API response, not from token
        setUser(response.data);
        setIsAuthenticated(true);

        // Set token expiration check
        // Parse the JWT to get expiration time (without external libraries)
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));

          const payload = JSON.parse(jsonPayload);
          if (payload.exp) {
            const expiresAt = payload.exp * 1000; // Convert to milliseconds
            const timeUntilExpiry = expiresAt - Date.now();

            if (timeUntilExpiry <= 0) {
              // Token already expired
              logout();
              return;
            }

            // Extend the session timeout to 24 hours instead of using the JWT expiry
            // This keeps the user logged in longer than the default JWT expiration
            const extendedSessionTimeout = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

            // Use the longer of the two timeouts
            const timeoutToUse = Math.max(timeUntilExpiry, extendedSessionTimeout);

            // Set timeout to logout when extended session expires
            setTimeout(logout, timeoutToUse);

            console.log("Session will expire in:", Math.floor(timeoutToUse / (60 * 1000)), "minutes");
          }
        } catch (error) {
          console.error("Error parsing JWT token:", error);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    // Listen for authentication events
    const handleAuthEvent = () => {
      checkAuth();
    };

    window.addEventListener("user-authenticated", handleAuthEvent);
    checkAuth();

    // Cleanup function
    return () => {
      axios.interceptors.response.eject(interceptor);
      window.removeEventListener("user-authenticated", handleAuthEvent);
    };
  }, [logout]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, user, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);
