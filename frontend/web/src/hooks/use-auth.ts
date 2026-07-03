import { useAuthStore } from "@/stores/auth-store";

export function useAuth() {
  const { user, token, isAuthenticated, logout } = useAuthStore();

  return {
    user,
    token,
    isAuthenticated,
    logout,
  };
}
