import { api } from "./api";
import type {
  ApiMessageSuccess,
} from "../types/api";
import type {
  AuthResponse,
  CurrentUserResponse,
} from "../types/auth";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export const authApi = {
  register(input: RegisterInput): Promise<AuthResponse> {
    return api.post<AuthResponse>("/auth/register", input);
  },

  login(input: LoginInput): Promise<AuthResponse> {
    return api.post<AuthResponse>("/auth/login", input);
  },

  getCurrentUser(): Promise<CurrentUserResponse> {
    return api.get<CurrentUserResponse>("/auth/me");
  },

  logout(): Promise<ApiMessageSuccess> {
    return api.post<ApiMessageSuccess>("/auth/logout", {});
  },
};