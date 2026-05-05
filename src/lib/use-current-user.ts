import { useAuth0 } from "@auth0/auth0-react";
export const auth0SubToUuid = (sub: string) => sub;
export const ensureGuestId = () => "guest";
export const clearGuestId = () => {};
export const isGuestActive = () => false;
export const setGuestActive = () => {};

export const useCurrentUser = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth0();
  return { 
    id: user?.sub || null, 
    user, 
    isAuthenticated, 
    isLoading, 
    logout: () => logout({ logoutParams: { returnTo: window.location.origin } }) 
  };
};
