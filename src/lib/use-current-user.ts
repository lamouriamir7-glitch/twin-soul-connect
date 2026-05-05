// (مجمع هوية Auth0 أو ضيف UUID) : مزود هوية موحد
import { useAuth0 } from "@auth0/auth0-react";
import { authSubToUuid } from "./auth-id";

const GUEST_KEY = "guest_uuid";

function genUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  const s = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  return s.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function ensureGuestId(): string {
  let id = localStorage.getItem(GUEST_KEY);
  if (!id) {
    id = genUuid();
    localStorage.setItem(GUEST_KEY, id);
  }
  return id;
}

export function clearGuestId() {
  localStorage.removeItem(GUEST_KEY);
}

export function isGuestActive(): boolean {
  return localStorage.getItem("is_guest") === "1";
}

export function setGuestActive(v: boolean) {
  if (v) localStorage.setItem("is_guest", "1");
  else localStorage.removeItem("is_guest");
}

export function useCurrentUser() {
  const { isAuthenticated, isLoading, user, logout } = useAuth0();
  const guestActive = isGuestActive();
  const guestId = guestActive ? ensureGuestId() : null;

  const id = isAuthenticated && user?.sub ? authSubToUuid(user.sub) : guestId;

  return {
    id,
    isLoading: isLoading && !guestActive,
    isAuthenticated: isAuthenticated || guestActive,
    isGuest: guestActive && !isAuthenticated,
    authOUser: user ?? null,
    logout: async () => {
      if (guestActive) {
        setGuestActive(false);
      }
      if (isAuthenticated) {
        await logout({ logoutParams: { returnTo: window.location.origin } });
      }
    },
  };
}
