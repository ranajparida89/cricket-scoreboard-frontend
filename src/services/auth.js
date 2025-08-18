// src/services/auth.js
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "user";
const TOKEN_KEY = "auth_token"; // optional: if you also store a JWT here

function safeJSONParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function decodeJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Normalize any "user" shape into:
 *  { id: number|string, email?: string, ...rest }
 * Tries multiple id keys and falls back to JWT payload if available.
 */
function normalizeUser(raw) {
  if (!raw) return null;
  const obj = typeof raw === "string" ? safeJSONParse(raw) ?? {} : { ...raw };

  // Prefer explicit ID fields
  let id =
    obj.id ??
    obj.user_id ??
    obj.userId ??
    obj.uid ??
    null;

  // Fallback: try to derive from a JWT either inside obj.token or localStorage
  if (id == null) {
    const token = obj.token || (typeof window !== "undefined" && localStorage.getItem(TOKEN_KEY));
    if (token) {
      const payload = decodeJwt(token) || {};
      id = payload.user_id ?? payload.id ?? payload.sub ?? null;
    }
  }

  // Coerce numeric if possible
  const numId = Number(id);
  const finalId = Number.isFinite(numId) ? numId : id ?? null;

  return finalId ? { ...obj, id: finalId } : { ...obj };
}

const AuthContext = createContext({
  currentUser: null,
  setCurrentUser: () => {},
  login: () => {},
  logout: () => {},
  refreshFromStorage: () => {},
});

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  // On mount, load from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    const normalized = normalizeUser(raw);
    if (normalized) setCurrentUser(normalized);
  }, []);

  // Persist to localStorage whenever currentUser changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (currentUser) {
      const normalized = normalizeUser(currentUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      // (Optional) persist token if you carry it on the user object
      if (normalized?.token) {
        localStorage.setItem(TOKEN_KEY, normalized.token);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [currentUser]);

  // Cross-tab sync
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        const normalized = normalizeUser(e.newValue);
        setCurrentUser(normalized || null);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = (userLike) => {
    const normalized = normalizeUser(userLike);
    setCurrentUser(normalized || null);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const refreshFromStorage = () => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    const normalized = normalizeUser(raw);
    setCurrentUser(normalized || null);
  };

  const value = useMemo(
    () => ({ currentUser, setCurrentUser, login, logout, refreshFromStorage }),
    [currentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
