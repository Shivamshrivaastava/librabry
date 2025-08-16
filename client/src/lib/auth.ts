import { apiRequest } from "./queryClient";

export interface AuthUser {
  id: string;
  email: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}

export const authApi = {
  async login(data: LoginData): Promise<{ user: AuthUser }> {
    const response = await apiRequest("POST", "/api/auth/login", data);
    return response.json();
  },

  async register(data: RegisterData): Promise<{ user: AuthUser }> {
    const response = await apiRequest("POST", "/api/auth/register", data);
    return response.json();
  },

  async logout(): Promise<void> {
    await apiRequest("POST", "/api/auth/logout");
  },

  async getCurrentUser(): Promise<{ user: AuthUser } | null> {
    try {
      const response = await apiRequest("GET", "/api/auth/me");
      return response.json();
    } catch (error) {
      return null;
    }
  },
};
